"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function followStory(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập để theo dõi truyện.");

  const { error } = await supabase
    .from("story_follows")
    .insert({
      user_id: user.id,
      story_id: storyId
    });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already following
    throw new Error(error.message);
  }

  revalidatePath(`/truyen/[storySlug]`);
  return { success: true };
}

export async function unfollowStory(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("story_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("story_id", storyId);

  if (error) throw new Error(error.message);

  revalidatePath(`/truyen/[storySlug]`);
  return { success: true };
}

export async function checkFollowStatus(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("story_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("story_id", storyId)
    .maybeSingle();

  return !!data;
}

export async function getFollowers(storyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_follows")
    .select("user_id")
    .eq("story_id", storyId);

  if (error) return [];
  return data.map(f => f.user_id);
}

import { createNotification } from "@/actions/notifications";
import { getStoryById } from "@/actions/stories";

export async function notifyFollowers(storyId: string, chapterTitle: string) {
  const followers = await getFollowers(storyId);
  const story = await getStoryById(storyId);

  if (!story || followers.length === 0) return;

  const notifications = followers.map(userId => 
    createNotification(
      userId,
      "update",
      "Chương mới ra mắt!",
      `Truyện "${story.title}" vừa cập nhật chương mới: "${chapterTitle}"`,
      `/truyen/${story.slug}` // Link to the story
    )
  );

  await Promise.all(notifications);
}
