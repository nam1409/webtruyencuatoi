"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSiteSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching settings:", error);
    return { site_genres: [] };
  }

  return data || { site_genres: [] };
}

export async function updateSiteSettings(key: string, value: any) {
  const supabase = await createClient();
  
  // Lấy ID của bản ghi đầu tiên
  const { data: existing } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  if (!existing) throw new Error("No site settings found to update");

  const { error } = await supabase
    .from("site_settings")
    .update({ [key]: value })
    .eq("id", existing.id);

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
  
  revalidatePath("/", "layout");
}

export async function updateMultipleSiteSettings(settings: Record<string, any>) {
  const supabase = await createClient();
  
  // Lấy ID của bản ghi đầu tiên
  const { data: existing } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  if (!existing) throw new Error("No site settings found to update");
  
  // Danh sách các cột hợp lệ trong bảng site_settings
  const validColumns = [
    'site_name', 'site_description', 'hero_title', 'hero_subtitle', 
    'hero_image_url', 'primary_color', 'primary_font', 'default_theme', 
    'google_font', 'enable_canvas', 'custom_themes', 'custom_fonts', 
    'site_genres', 'homepage_layout', 'featured_story_id', 'show_stats', 
    'show_new_releases', 'show_popular', 'custom_css', 'force_https', 
    'maintenance_mode', 'allow_registration', 'email_notifications',
    'enable_shoutbox'
  ];

  const safeSettings: Record<string, any> = {};
  Object.keys(settings).forEach(key => {
    if (validColumns.includes(key)) {
      safeSettings[key] = settings[key];
    }
  });

  const { error } = await supabase
    .from("site_settings")
    .update(safeSettings)
    .eq("id", existing.id);

  if (error) {
    console.error("Error updating multiple settings:", error);
    throw error;
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getSiteStats() {
  const supabase = await createClient();
  
  const [stories, users, comments, chapters] = await Promise.all([
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('chapters').select('*', { count: 'exact', head: true })
  ]);

  return {
    stories: stories.count || 0,
    users: users.count || 0,
    comments: comments.count || 0,
    chapters: chapters.count || 0
  };
}
