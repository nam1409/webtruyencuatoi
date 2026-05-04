"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getChapter(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("*, stories(title, slug)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }

  return data;
}

export async function updateChapter(id: string, updates: any) {
  const supabase = await createClient();
  
  // If content_json is provided, it's a versionable update
  const { data, error } = await supabase
    .from("chapters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating chapter:", error);
    throw new Error("Failed to update chapter");
  }

  revalidatePath(`/admin/editor/${id}`);
  return data;
}

export async function publishChapter(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .update({ 
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error publishing chapter:", error);
    throw new Error("Failed to publish chapter");
  }

  revalidatePath(`/admin/editor/${id}`);
  // Also revalidate the reader page if we have the slug
  // revalidatePath(`/truyen/${storySlug}/${chapterSlug}`);
  
  return data;
}
