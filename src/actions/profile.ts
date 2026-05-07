"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: {
  display_name: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bạn cần đăng nhập để thực hiện hành động này" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: formData.display_name,
      bio: formData.bio,
      website: formData.website,
      avatar_url: formData.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/profile");
  revalidatePath("/");
  return { success: true };
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
