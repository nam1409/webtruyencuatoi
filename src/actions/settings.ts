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
  
  const { error } = await supabase
    .from("site_settings")
    .update({ [key]: value })
    .eq("id", "00000000-0000-0000-0000-000000000000"); // Sử dụng ID mặc định từ init script

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
  
  revalidatePath("/", "layout");
}

export async function updateMultipleSiteSettings(settings: Record<string, any>) {
  const supabase = await createClient();
  
  // Danh sách các cột hợp lệ trong bảng site_settings
  const validColumns = [
    'site_name', 'site_description', 'hero_title', 'hero_subtitle', 
    'hero_image_url', 'primary_color', 'primary_font', 'default_theme', 
    'google_font', 'enable_canvas', 'custom_themes', 'custom_fonts', 
    'site_genres', 'homepage_layout', 'featured_story_id', 'show_stats', 
    'show_new_releases', 'show_popular', 'custom_css', 'force_https', 
    'maintenance_mode', 'allow_registration', 'email_notifications'
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
    .eq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("Error updating multiple settings:", error);
    throw error;
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}
