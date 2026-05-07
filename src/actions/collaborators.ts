"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCollaborators(storyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("story_collaborators")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url, username)
    `)
    .eq("story_id", storyId);

  if (error) {
    console.error("Error fetching collaborators:", error);
    return [];
  }

  return data;
}

export async function addCollaborator(storyId: string, username: string, role: string = 'editor') {
  const supabase = await createClient();

  // 1. Find user by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError || !profile) throw new Error("Không tìm thấy người dùng này.");

  // 2. Add collaborator
  const { data, error } = await supabase
    .from("story_collaborators")
    .insert({
      story_id: storyId,
      user_id: profile.id,
      role: role
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error("Người dùng này đã là cộng tác viên.");
    throw new Error(error.message);
  }

  revalidatePath(`/admin/stories/${storyId}`);
  return data;
}

export async function removeCollaborator(collaboratorId: string, storyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("story_collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/stories/${storyId}`);
}
