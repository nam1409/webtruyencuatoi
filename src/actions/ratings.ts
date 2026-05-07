"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function rateStory(storyId: string, rating: number, review?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập để đánh giá.");

  const { data, error } = await supabase
    .from("ratings")
    .upsert({
      user_id: user.id,
      story_id: storyId,
      rating: rating,
      review: review,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id, story_id' })
    .select()
    .single();

  if (error) {
    console.error("Error rating story:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/truyen/[storySlug]`);
  return data;
}

export async function getStoryRating(storyId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("story_id", storyId);

  if (error || !data) return { average: 0, count: 0 };

  const total = data.reduce((acc, curr) => acc + curr.rating, 0);
  const average = data.length > 0 ? total / data.length : 0;

  return {
    average: parseFloat(average.toFixed(1)),
    count: data.length
  };
}

export async function getUserRating(storyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", user.id)
    .eq("story_id", storyId)
    .maybeSingle();

  return data;
}
