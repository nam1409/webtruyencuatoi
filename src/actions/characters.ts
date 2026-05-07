"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCharactersByStory(storyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("story_id", storyId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching characters:", error);
    return [];
  }

  return data;
}

export async function upsertCharacter(formData: any) {
  const supabase = await createClient();
  
  const characterData = {
    story_id: formData.story_id,
    name: formData.name,
    avatar_url: formData.avatar_url || null,
    description: formData.description || "",
    metadata: formData.metadata || {},
  };

  let result;
  if (formData.id) {
    result = await supabase
      .from("characters")
      .update(characterData)
      .eq("id", formData.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("characters")
      .insert(characterData)
      .select()
      .single();
  }

  if (result.error) {
    console.error("Error upserting character:", result.error);
    throw new Error(result.error.message);
  }

  revalidatePath(`/admin/stories/${formData.story_id}/settings`);
  return result.data;
}

export async function deleteCharacter(id: string, storyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting character:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/admin/stories/${storyId}/settings`);
}
