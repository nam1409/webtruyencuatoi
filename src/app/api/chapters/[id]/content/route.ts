import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { obfuscateToGlyphs } from "@/lib/obfuscator";
import { redis, ratelimit } from "@/lib/redis";
import { headers } from "next/headers";
import { renderToHtml } from "@/lib/anti-copy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const versionId = url.searchParams.get('v');
  const cacheKey = versionId ? `chapter:content:${id}:v:${versionId}` : `chapter:content:${id}`;
  
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "anonymous";
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
      }

      // 1. Kiểm tra Cache Redis trước
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("API DEBUG: Returning CACHED content for key:", cacheKey);
        return NextResponse.json({ ...cached as any, source: 'redis_cache' });
      }
    }

    const supabase = await createClient();
    
    let resolvedContent = null;
    let resolvedConfig = null;

    // 1. Trường hợp yêu cầu đích danh Bản gốc (v=main)
    console.log("API DEBUG: Requesting versionId:", versionId, "for chapter:", id);

    if (versionId === 'main') {
      const { data: chapterData } = await supabase
        .from("chapters")
        .select("content_json, password_hash, password_hint, is_anti_copy, stories(is_protected)")
        .eq("id", id)
        .single();
      
      if (chapterData) {
        console.log("API DEBUG: Found Original Content");
        resolvedContent = chapterData.content_json;
        resolvedConfig = chapterData;
      }
    } 
    // 2. Trường hợp yêu cầu một phiên bản cụ thể qua ID
    else if (versionId) {
      const { data: vData, error: vError } = await supabase
        .from("chapter_versions")
        .select("content_json, chapters(password_hash, password_hint, is_anti_copy, stories(is_protected))")
        .eq("id", versionId)
        .eq("status", "published")
        .single();
      
      if (vError) {
        console.error("API DEBUG: Error fetching version:", vError);
      }

      if (vData) {
        console.log("API DEBUG: Found Version Content for ID:", versionId);
        resolvedContent = vData.content_json;
        const chapters: any = vData.chapters;
        resolvedConfig = {
          password_hash: chapters?.password_hash,
          password_hint: chapters?.password_hint,
          is_anti_copy: chapters?.is_anti_copy,
          stories: chapters?.stories
        };
      } else {
        console.log("API DEBUG: Version ID not found or not published:", versionId);
      }
    }

    // 3. Trường hợp không gửi v (Lấy bản mặc định/Primary)
    if (!resolvedContent) {
      console.log("API DEBUG: No specific content resolved, trying primary...");
      const { data: primaryV } = await supabase
        .from("chapter_versions")
        .select("content_json, chapters(password_hash, password_hint, is_anti_copy, stories(is_protected))")
        .eq("chapter_id", id)
        .eq("status", "published")
        .eq("is_primary", true)
        .maybeSingle();

      if (primaryV) {
        resolvedContent = primaryV.content_json;
        const chapters: any = primaryV.chapters;
        resolvedConfig = {
          password_hash: chapters?.password_hash,
          password_hint: chapters?.password_hint,
          is_anti_copy: chapters?.is_anti_copy,
          stories: chapters?.stories
        };
      } else {
        const { data: chapterData, error: cError } = await supabase
          .from("chapters")
          .select("content_json, password_hash, password_hint, is_anti_copy, stories(is_protected)")
          .eq("id", id)
          .single();

        if (cError || !chapterData) {
          return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }
        resolvedContent = chapterData.content_json;
        resolvedConfig = chapterData;
      }
    }

    // Kiểm tra mật khẩu
    const rawPassword = request.headers.get("x-chapter-password");
    const providedPassword = rawPassword ? decodeURIComponent(rawPassword) : null;
    
    if (!resolvedConfig) {
      return NextResponse.json({ error: "Không tìm thấy nội dung chương." }, { status: 404 });
    }

    if (resolvedConfig.password_hash && resolvedConfig.password_hash !== providedPassword) {
      return NextResponse.json({ 
        is_locked: true,
        password_hint: resolvedConfig.password_hint,
        error: "Mật khẩu không chính xác hoặc chương này được bảo vệ." 
      }, { status: 403 });
    }

    if (!resolvedContent) {
      console.log("API DEBUG: Final check - No content found even after all fallbacks");
      return NextResponse.json({ data: { type: 'doc', content: [] }, key: '', source: 'db' });
    }

    // Lấy thông tin bảo mật một cách an toàn
    // Nếu là bản gốc, resolvedConfig chính là chapter object
    // Nếu là version, resolvedConfig là vData.chapters
    const config = resolvedConfig;
    const stories = config.stories;
    
    // Kiểm tra is_protected từ stories (có thể là object hoặc array)
    let isStoryProtected = false;
    if (stories) {
      if (Array.isArray(stories)) {
        isStoryProtected = !!stories[0]?.is_protected;
      } else {
        isStoryProtected = !!(stories as any).is_protected;
      }
    }
    
    const isCanvasProtected = isStoryProtected;
    const isAntiCopy = !!config.is_anti_copy;

    let responseData;
    if (isCanvasProtected) {
      // 1. Nội dung bảo vệ bằng Canvas (Glyph Obfuscation)
      const obfuscated = obfuscateToGlyphs(resolvedContent);
      responseData = { 
        data: obfuscated.data, 
        is_rendered: false, 
        key: obfuscated.key 
      };
    } else if (isAntiCopy) {
      // 2. Nội dung bảo vệ bằng "Rác" (Static HTML)
      const renderedHtml = renderToHtml(resolvedContent, id);
      const encodedHtml = Buffer.from(renderedHtml).toString('base64');
      responseData = { html: encodedHtml, is_rendered: true, key: '' };
    } else {
      // 3. Nội dung không bảo vệ (Render thẳng)
      responseData = { data: resolvedContent, is_rendered: false, key: '' };
    }

    if (process.env.UPSTASH_REDIS_REST_URL && !resolvedConfig.password_hash) {
      await redis.set(cacheKey, responseData, { ex: 86400 });
    }

    return NextResponse.json({ ...responseData, source: 'database_fresh' });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
