"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  // Run checks in parallel for maximum speed
  const [profileRes, storiesRes, collabRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("stories").select("id", { count: "exact", head: true }).eq("author_id", user.id).limit(1),
    supabase.from("story_collaborators").select("id", { count: "exact", head: true }).eq("user_id", user.id).limit(1)
  ]);

  if (profileRes.data?.role === "admin") return true;
  if (storiesRes.count && storiesRes.count > 0) return true;
  if (collabRes.count && collabRes.count > 0) return true;

  return false;
}

export async function getGlobalStats() {
  const supabase = await createClient();

  // Fetch counts from real tables
  const { count: storiesCount } = await supabase.from("stories").select("*", { count: "exact", head: true });
  const { count: chaptersCount } = await supabase.from("chapters").select("*", { count: "exact", head: true });
  const { count: commentsCount } = await supabase.from("comments").select("*", { count: "exact", head: true });
  
  // Aggregate total views from stories table (source of truth for total)
  const { data: storiesData } = await supabase.from("stories").select("views_count_total");
  const totalViews = storiesData?.reduce((acc, curr) => acc + (curr.views_count_total || 0), 0) || 0;

  return {
    stories: storiesCount || 0,
    chapters: chaptersCount || 0,
    comments: commentsCount || 0,
    views: totalViews,
  };
}

export async function getRecentActivity(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }

  return data;
}

export async function logActivity(action: string, targetType?: string, targetId?: string, details?: string, metadata?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const { error } = await supabase.from("activity_logs").insert({
    user_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    metadata
  });

  if (error) console.error("Failed to log activity:", error);
}

// getSiteSettings has been moved to src/actions/settings.ts with Redis caching.

import { revalidatePath } from "next/cache";

export async function updateHomepageLayout(layout: any[]) {
  const supabase = await createClient();
  
  // Verify admin
  const isAdmin = await checkAdminRole();
  if (!isAdmin) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("site_settings")
    .update({ 
      homepage_layout: layout,
      updated_at: new Date().toISOString()
    })
    .eq("id", (await supabase.from("site_settings").select("id").single()).data?.id);

  if (error) {
    console.error("Error updating layout:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
  return { success: true };
}
