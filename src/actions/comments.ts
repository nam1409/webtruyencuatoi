"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAdminComments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url),
      chapters:chapter_id (title, story_id, stories(title))
    `)
    .order("created_at", { ascending: false });

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
    .select("title, story_id")
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
  if (chapter) {
    const story = await getStoryById(chapter.story_id);
    if (story && story.author_id !== user.id) {
      await createNotification(
        story.author_id,
        "comment",
        "Bình luận mới",
        `Độc giả đã để lại bình luận tại chương "${chapter.title}" của truyện "${story.title}"`,
        `/admin/comments`
      );
    }
  }

  revalidatePath(`/truyen/[storySlug]/[chapterSlug]`);
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
