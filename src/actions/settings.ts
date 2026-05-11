"use server";

import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSiteSettings() {
  const cacheKey = "site_settings:global";
  
  // Try Redis cache first
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any;
    } catch (e: any) {
      // Don't log dynamic usage errors during build
      if (e.message?.includes("Dynamic server usage")) return;
      console.error("Redis settings cache error:", e);
    }
  }

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

  const result = data || { site_genres: [] };

  // Save to Redis
  if (process.env.UPSTASH_REDIS_REST_URL && data) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 }); // Cache for 1 hour
    } catch (e: any) {
      if (e.message?.includes("Dynamic server usage")) return;
      console.error("Redis settings save error:", e);
    }
  }

  return result;
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
  
  // Clear cache
  if (process.env.UPSTASH_REDIS_REST_URL) {
    await redis.del("site_settings:global").catch(console.error);
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
  
  // Clear cache
  if (process.env.UPSTASH_REDIS_REST_URL) {
    await redis.del("site_settings:global").catch(console.error);
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
