"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPublicProfile(userId: string) {
  const supabase = await createClient();

  // 1. Lấy thông tin cơ bản
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return null;

  // 2. Lấy danh sách truyện của tác giả này
  const { data: stories } = await supabase
    .from("stories")
    .select("*, categories(name)")
    .eq("author_id", userId)
    .eq("status", "published")
    .order("views_count_total", { ascending: false });

  // 3. Lấy hoạt động gần đây (News Feed)
  const { data: activities } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 4. Lấy số lượt theo dõi (Followers)
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  return {
    ...profile,
    stories: stories || [],
    activities: activities || [],
    followersCount: followersCount || 0
  };
}

export async function updateProfile(data: { bio?: string, display_name?: string, avatar_url?: string, banner_url?: string, social_links?: any }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) throw error;
  return { success: true };
}
