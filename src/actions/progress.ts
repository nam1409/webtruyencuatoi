"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveReadingProgress(storyId: string, chapterId: string, scrollPosition: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  // 1. Update main progress (last chapter read)
  const { error: mainError } = await supabase
    .from("reading_progress")
    .upsert({
      user_id: user.id,
      story_id: storyId,
      chapter_id: chapterId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, story_id' });

  if (mainError) console.error("Error saving main progress:", mainError);

  // 2. Update scroll tracker
  const { error: scrollError } = await supabase
    .from("user_reading_progress")
    .upsert({
      user_id: user.id,
      story_id: storyId,
      chapter_id: chapterId,
      scroll_position: scrollPosition,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, story_id' });

  if (scrollError) console.error("Error saving scroll progress:", scrollError);
}

export async function getReadingProgress(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_reading_progress")
    .select("chapter_id, scroll_position, chapters(title, slug)")
    .eq("user_id", user.id)
    .eq("story_id", storyId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching reading progress:", error);
    return null;
  }

  return data;
}

export async function getAllProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("reading_progress")
    .select(`
      story_id,
      updated_at,
      stories (
        title,
        slug,
        cover_url,
        profiles:author_id (display_name)
      ),
      chapters:chapter_id (
        title,
        slug
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching all progress:", error);
    return [];
  }

  return data;
}
