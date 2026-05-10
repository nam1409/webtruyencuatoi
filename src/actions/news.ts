"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNews(limit = 5, category?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("news")
    .select(`
      *,
      profiles:author_id (display_name, avatar_url)
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && category !== "Tất cả") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching news:", error);
    return [];
  }

  return data;
}

export async function getNewsById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("news")
    .select(`
      *,
      profiles:author_id (display_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching news by id:", error);
    return null;
  }

  return data;
}

export async function createNews(data: {
  title: string;
  content: string;
  category: string;
  is_pinned?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("news")
    .insert({
      ...data,
      author_id: user.id
    });

  if (error) throw new Error(error.message);
  
  revalidatePath("/");
  revalidatePath("/admin/news");
}

export async function deleteNews(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/");
  revalidatePath("/admin/news");
}
