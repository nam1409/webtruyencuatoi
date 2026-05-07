"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSiteSettings(): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, site_description, primary_color, primary_font, default_theme, google_font, enable_canvas, custom_themes, custom_fonts, site_genres")
    .limit(1)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error("Error fetching settings:", error);
    }
    return { site_genres: [] };
  }

  return data || { site_genres: [] };
}

export async function updateSiteSettings(key: string, value: any) {
  const supabase = await createClient();
  
  // Lấy ID của dòng cài đặt hiện tại
  const { data: current } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (!current) {
    // Nếu chưa có dòng nào, tạo mới
    const { error } = await supabase
      .from("site_settings")
      .insert([{ [key]: value }]);
    if (error) throw new Error(error.message);
  } else {
    // Cập nhật cột cụ thể
    const { error } = await supabase
      .from("site_settings")
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq("id", current.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/", "layout");
}
