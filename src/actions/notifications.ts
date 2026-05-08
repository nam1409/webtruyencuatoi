"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data;
}

export async function markAsRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createNotification(userId: string, type: string, title: string, content: string, link?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_system_notification", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_content: content,
    p_link: link
  });

  if (error) {
    console.error("Error creating notification:", error);
  }
}
