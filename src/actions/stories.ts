"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";
import { logActivity } from "@/actions/admin";

export async function getStories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // 1. Get stories where user is the author
  const { data: ownedStories, error: ownedError } = await supabase
    .from("stories")
    .select(`
      *,
      chapters (
        id,
        comments (count)
      )
    `)
    .eq("author_id", user.id);

  // 2. Get stories where user is a collaborator
  const { data: collabData, error: collabError } = await supabase
    .from("story_collaborators")
    .select(`
      story_id,
      stories (
        *,
        chapters (
          id,
          comments (count)
        )
      )
    `)
    .eq("user_id", user.id);

  if (ownedError || collabError) {
    console.error("Error fetching stories:", ownedError || collabError);
    return [];
  }

  // Combine and deduplicate
  const allStoriesRaw = [...(ownedStories || [])];
  collabData?.forEach(item => {
    if (!item.stories) return;
    
    // Supabase might return an array or a single object depending on relationship types
    const story = Array.isArray(item.stories) ? item.stories[0] : item.stories;
    if (story && !allStoriesRaw.find(s => s.id === story.id)) {
      allStoriesRaw.push(story);
    }
  });

  // Calculate comment counts and sort
  const storiesWithCounts = allStoriesRaw.map(story => {
    const totalComments = story.chapters?.reduce((acc: number, chapter: any) => {
      const count = chapter.comments?.[0]?.count || 0;
      return acc + count;
    }, 0) || 0;
    
    return {
      ...story,
      comment_count: totalComments
    };
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return storiesWithCounts;
}

export async function getStoryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching story:", error);
    return null;
  }

  return data;
}

export async function getStoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .select(`
      *,
      profiles:author_id (id, username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching story by slug:", error);
    return null;
  }

  // Security Check: If private, verify access
  const { data: { user } } = await supabase.auth.getUser();
  const isAdminOrOwner = async () => {
    if (!user) return false;
    
    // Global Admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return true;

    // Author access
    if (data.author_id === user.id) return true;

    // Collaborator access
    const { data: collab } = await supabase
      .from("story_collaborators")
      .select("id")
      .eq("story_id", data.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (collab) return true;

    return false;
  };

  const isManagement = await isAdminOrOwner();

  // Scheduled check
  if (!isManagement && data.scheduled_at && new Date(data.scheduled_at) > new Date()) {
    return null;
  }

  // Privacy Check
  if (data.is_private && !isManagement) {
    if (!user) return null;
    
    // Whitelist access
    const { data: access } = await supabase
      .from("story_access_list")
      .select("id")
      .eq("story_id", data.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!access) return null; // Deny access
  }

  return data;
}

export async function createStory(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Ensure profile exists (in case trigger failed or user existed before trigger)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: user.email?.split("@")[0] || `user_${user.id.slice(0, 5)}`,
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
    });
    
    if (insertError) {
      console.error("Failed to auto-create profile:", insertError);
      throw new Error("Tài khoản của bạn chưa được khởi tạo.");
    }
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      title: formData.title,
      description: formData.description,
      slug: formData.slug,
      cover_url: formData.cover_url,
      status: formData.status,
      is_protected: formData.is_protected,
      genres: formData.genres,
      tags: formData.tags,
      metadata: formData.metadata,
      allow_offline: formData.allow_offline,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating story:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    "create_story",
    "story",
    data.id,
    `Đã tạo tác phẩm mới: ${data.title}`
  );

  revalidatePath("/admin");
  return data;
}



export async function updateStory(id: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating story:", error);
    throw new Error(error.message);
  }

  // Nếu thay đổi cài đặt bảo vệ, xóa toàn bộ cache của các chương thuộc truyện này
  if (process.env.UPSTASH_REDIS_REST_URL && updates.hasOwnProperty('is_protected')) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("story_id", id);
    
    if (chapters && chapters.length > 0) {
      const keys = chapters.map(c => `chapter_content:${c.id}`);
      await redis.del(...keys);
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/stories/${id}`);

  // Log activity
  await logActivity(
    "update_story",
    "story",
    id,
    `Đã cập nhật thông tin tác phẩm: ${data.title}`
  );

  return data;
}

export async function deleteStory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity(
    "delete_story",
    "story",
    id,
    `Đã xóa tác phẩm (ID: ${id})`
  );

  revalidatePath("/admin");
}

export async function getStoryAnalytics(storyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_views_daily")
    .select("view_date, view_count")
    .eq("story_id", storyId)
    .order("view_date", { ascending: true })
    .limit(30);

  if (error) {
    console.error("Error fetching analytics:", error);
    return [];
  }

  return data;
}

export async function exportStoryToMarkdown(storyId: string) {
  const supabase = await createClient();
  
  // 1. Get story info
  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .single();

  if (!story) throw new Error("Story not found");

  // 2. Get all chapters
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", storyId)
    .order("order_index", { ascending: true });

  if (!chapters) return "";

  // 3. Compile into markdown
  let markdown = `# ${story.title}\n\n`;
  if (story.description) markdown += `> ${story.description}\n\n---\n\n`;

  for (const chapter of chapters) {
    markdown += `## ${chapter.title}\n\n`;
    markdown += tiptapToMarkdown(chapter.content_json);
    markdown += `\n\n---\n\n`;
  }

  return markdown;
}

// Simple Tiptap JSON to Markdown converter
function tiptapToMarkdown(json: any): string {
  if (!json || !json.content) return "";
  
  let md = "";
  for (const node of json.content) {
    if (node.type === "paragraph") {
      md += renderNodeContent(node) + "\n\n";
    } else if (node.type === "heading") {
      const level = node.attrs?.level || 1;
      md += "#".repeat(level) + " " + renderNodeContent(node) + "\n\n";
    } else if (node.type === "blockquote") {
      md += "> " + renderNodeContent(node) + "\n\n";
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      if (node.content) {
        for (const item of node.content) {
          md += "- " + renderNodeContent(item) + "\n";
        }
      }
      md += "\n";
    } else if (node.type === "image") {
      md += `![${node.attrs?.alt || ""}](${node.attrs?.src})\n\n`;
    }
  }
  return md;
}

function renderNodeContent(node: any): string {
  if (!node.content) return "";
  return node.content.map((child: any) => {
    let text = child.text || "";
    if (child.marks) {
      for (const mark of child.marks) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `*${text}*`;
        if (mark.type === "strike") text = `~~${text}~~`;
        if (mark.type === "code") text = `\`${text}\``;
      }
    }
    // If it's a list item, it might have content which is a paragraph
    if (child.type === "paragraph") return renderNodeContent(child);
    
    return text;
  }).join("");
}

export async function getStoryReaders(storyId: string, page: number = 1, limit: number = 10) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // For a truly scalable solution, we'd use a separate 'story_readers' table or a complex RPC
  // But for now, we'll fetch the most recent reading activities and aggregate
  const { data, error, count } = await supabase
    .from("reading_progress")
    .select(`
      user_id,
      updated_at,
      chapter_id,
      profiles:user_id (id, username, display_name, avatar_url)
    `, { count: 'exact' })
    .eq("story_id", storyId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching story readers:", error);
    return { readers: [], totalCount: 0 };
  }

  // Aggregate by user_id
  const readerMap = new Map();
  data.forEach((entry: any) => {
    if (!readerMap.has(entry.user_id)) {
      readerMap.set(entry.user_id, {
        profile: entry.profiles,
        last_read_at: entry.updated_at,
        chapters_read_ids: new Set([entry.chapter_id]),
      });
    } else {
      const reader = readerMap.get(entry.user_id);
      reader.chapters_read_ids.add(entry.chapter_id);
      if (new Date(entry.updated_at) > new Date(reader.last_read_at)) {
        reader.last_read_at = entry.updated_at;
      }
    }
  });

  const allReaders = Array.from(readerMap.values()).map(reader => ({
    profile: reader.profile,
    last_read_at: reader.last_read_at,
    chapters_count: reader.chapters_read_ids.size
  }));

  const paginatedReaders = allReaders.slice(offset, offset + limit);

  return {
    readers: paginatedReaders,
    totalCount: allReaders.length
  };
}

export async function grantStoryAccess(storyId: string, username: string) {
  const supabase = await createClient();

  // 1. Find user by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError || !profile) throw new Error("Không tìm thấy người dùng này.");

  // 2. Add to access list
  const { error } = await supabase
    .from("story_access_list")
    .insert({
      story_id: storyId,
      user_id: profile.id
    });

  if (error) {
    if (error.code === '23505') throw new Error("Người dùng này đã có quyền truy cập.");
    throw new Error(error.message);
  }

  revalidatePath(`/admin/stories/${storyId}`);
}

export async function revokeStoryAccess(storyId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("story_access_list")
    .delete()
    .eq("story_id", storyId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/stories/${storyId}`);
}

export async function getStoryAccessList(storyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("story_access_list")
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `)
    .eq("story_id", storyId);

  if (error) {
    console.error("Error fetching access list:", error);
    return [];
  }

  return data;
}

export async function searchStories(query: string, genre?: string) {
  const supabase = await createClient();
  
  let q = supabase
    .from("stories")
    .select(`
      *,
      profiles:author_id (display_name, avatar_url),
      chapters:chapters(count)
    `)
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`);

  if (query) {
    // Sử dụng Full-text Search của Postgres qua Supabase
    // Lưu ý: Cần có index GIN trên title và description để đạt hiệu suất tốt nhất
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (genre && genre !== "Tất cả") {
    q = q.contains("genres", [genre]);
  }

  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data.map(s => ({
    ...s,
    chapter_count: s.chapters?.[0]?.count || 0
  }));
}
