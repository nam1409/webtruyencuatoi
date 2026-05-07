import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { obfuscateToGlyphs } from "@/lib/obfuscator";
import { redis, ratelimit } from "@/lib/redis";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 1. Rate Limiting dựa trên IP
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "anonymous";
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
      }
    }

    // 1. Lấy thông tin bảo mật từ Supabase trước
    const supabase = await createClient();
    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("content_json, password_hash, stories(is_protected)")
      .eq("id", id)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // 2. Kiểm tra mật khẩu
    const providedPassword = request.headers.get("x-chapter-password");
    if (chapter.password_hash && chapter.password_hash !== providedPassword) {
      return NextResponse.json({ 
        is_locked: true,
        error: "Mật khẩu không chính xác hoặc chương này được bảo vệ." 
      }, { status: 403 });
    }

    // 3. Nếu vượt qua bảo mật, mới kiểm tra Cache Redis
    const cacheKey = `chapter_content:${id}`;
    if (process.env.UPSTASH_REDIS_REST_URL && !chapter.password_hash) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const storyData = Array.isArray(chapter.stories) ? chapter.stories[0] : chapter.stories;
        return NextResponse.json({ 
          ...(cached as any), 
          source: 'cache',
          is_protected: (storyData as any)?.is_protected 
        });
      }
    }

    // 4. Mã hóa nội dung (Chỉ mã hóa nếu chương được đánh dấu bảo vệ)
    if (!chapter.content_json) {
      return NextResponse.json({ data: { type: 'doc', content: [] }, key: '', source: 'db' });
    }

    try {
      // Nếu chương được bảo vệ, dùng Glyph Mapping, ngược lại dùng nội dung gốc
      const storyData = Array.isArray(chapter.stories) ? chapter.stories[0] : chapter.stories;
      const isProtected = (storyData as any)?.is_protected;
      const responseData = isProtected 
        ? obfuscateToGlyphs(chapter.content_json)
        : { data: chapter.content_json, key: '' };

      // 5. Lưu vào Cache
      if (process.env.UPSTASH_REDIS_REST_URL && !chapter.password_hash) {
        await redis.set(cacheKey, responseData, { ex: 86400 });
      }

      return NextResponse.json({ ...responseData, source: 'db', is_protected: isProtected });
    } catch (obfuscationError) {
      console.error("Obfuscation Error:", obfuscationError);
      return NextResponse.json({ 
        data: chapter.content_json, // Fallback về nội dung gốc nếu mã hóa lỗi
        key: '',
        error: "Mã hóa nội dung thất bại" 
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
