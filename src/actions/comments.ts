"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAdminComments(chapterId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url),
      chapters:chapter_id (title, story_id, stories(title))
    `);

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data;
}

export async function getCommentsByChapter(chapterId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url)
    `)
    .eq("chapter_id", chapterId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chapter comments:", error);
    return [];
  }

  return data;
}

export async function getCommentCountsByParagraph(chapterId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("paragraph_id")
    .eq("chapter_id", chapterId)
    .eq("is_approved", true)
    .not("paragraph_id", "is", null);

  if (error) {
    console.error("Error fetching comment counts:", error);
    return {};
  }

  // Aggregate counts manually since JS is easier for this specific shape
  const counts: Record<string, number> = {};
  data.forEach(comment => {
    if (comment.paragraph_id) {
      counts[comment.paragraph_id] = (counts[comment.paragraph_id] || 0) + 1;
    }
  });

  return counts;
}

import { getStoryById } from "@/actions/stories";
import { createNotification } from "@/actions/notifications";

export async function createComment(data: {
  chapter_id: string;
  content: string;
  paragraph_id?: string;
  parent_id?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập để bình luận.");

  // Get chapter info to find the story and author
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, slug, story_id, stories(title, slug, author_id)")
    .eq("id", data.chapter_id)
    .single();

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      ...data,
      user_id: user.id,
      is_approved: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify the author
  if (chapter && chapter.stories) {
    // Supabase returns joined objects as arrays when using select syntax like stories(...)
    const story = Array.isArray(chapter.stories) ? chapter.stories[0] : (chapter.stories as any);
    
    if (!story) return comment;

    // 1. Notify Story Author
    if (story.author_id !== user.id) {
      await createNotification(
        story.author_id,
        "comment",
        "Bình luận mới",
        `Độc giả đã để lại bình luận tại chương "${chapter.title}" của truyện "${story.title}"`,
        `/admin/comments?chapterId=${data.chapter_id}#comment-${comment.id}`
      );
    }

    // 2. Notify Parent Commenter (if it's a reply)
    if (data.parent_id) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", data.parent_id)
        .single();

      if (parentComment && parentComment.user_id !== user.id) {
        await createNotification(
          parentComment.user_id,
          "reply",
          "Phản hồi mới",
          `Có người đã phản hồi bình luận của bạn tại chương "${chapter.title}"`,
          `/truyen/${story.slug}/${chapter.slug}#comment-${comment.id}`
        );
      }
    }

    // Targeted Revalidation (Temporarily disabled for debugging)
    revalidatePath(`/truyen/${story.slug}/${chapter.slug}`);
  }
  return comment;
}

export async function approveComment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ is_approved: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/comments");
}

export async function deleteComment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/comments");
}
