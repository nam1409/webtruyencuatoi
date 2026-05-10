"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Initialize Ratelimit if Redis is available
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }) 
  : null;

const ratelimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 messages per minute
    }) 
  : null;

export async function getShoutboxMessages(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shoutbox")
    .select(`
      *,
      profiles:user_id (
        username,
        display_name,
        avatar_url,
        role
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching shoutbox messages:", error);
    return [];
  }

  // Return in chronological order for the UI
  return data.reverse();
}

export async function sendShoutboxMessage(content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn cần đăng nhập để nhắn tin.");
  }

  if (!content || content.trim().length === 0) {
    throw new Error("Nội dung tin nhắn không được để trống.");
  }

  if (content.length > 500) {
    throw new Error("Tin nhắn quá dài (tối đa 500 ký tự).");
  }

  // Rate Limiting
  if (ratelimit) {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "anonymous";
    const { success } = await ratelimit.limit(`shoutbox:${user.id}:${ip}`);
    if (!success) {
      throw new Error("Bạn đang nhắn tin quá nhanh. Vui lòng đợi một chút.");
    }
  }

  const { error } = await supabase
    .from("shoutbox")
    .insert({
      user_id: user.id,
      content: content.trim()
    });

  if (error) {
    console.error("Error sending shoutbox message:", error);
    throw new Error("Không thể gửi tin nhắn. Vui lòng thử lại sau.");
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteShoutboxMessage(id: string) {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error("Chỉ Admin mới có quyền xóa tin nhắn.");
  }

  const { error } = await supabase
    .from("shoutbox")
    .delete()
    .eq("id", id);

  if (error) throw error;
  
  revalidatePath("/");
  return { success: true };
}
