"use server";

import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function trackView(chapterId: string, storyId: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // Fallback to direct DB update if Redis is not available
    const supabase = await createClient();
    if (chapterId) {
      await supabase.rpc('increment_view_count', { target_chapter_id: chapterId });
    } else {
      await supabase.rpc('increment_story_view', { target_story_id: storyId });
    }
    return;
  }

  try {
    const head = await headers();
    const ip = head.get("x-forwarded-for") || "unknown";
    const userAgent = head.get("user-agent") || "unknown";
    
    // Create a unique key for this view attempt (IP + ID + Date)
    const today = new Date().toISOString().split("T")[0];
    const viewLockKey = `view_lock:${ip}:${chapterId || storyId}:${today}`;
    
    // Check if this IP has already viewed this today
    const alreadyViewed = await redis.get(viewLockKey);
    if (alreadyViewed) return { success: false, message: "Already viewed today" };

    // Set lock for 24 hours
    await redis.set(viewLockKey, "1", { ex: 24 * 60 * 60 });

    // Increment counters in Redis
    if (chapterId) {
      await redis.incr(`chapter_views:${chapterId}`);
      await redis.zincrby("trending_chapters", 1, chapterId);
    }
    
    if (storyId) {
      await redis.incr(`story_views:${storyId}`);
      await redis.zincrby("trending_stories", 1, storyId);
    }

    // Sync to DB immediately or via background task
    // For simplicity, we'll do it here, but ideally this would be a background job
    const supabase = await createClient();
    if (chapterId) {
      await supabase.rpc('increment_view_count', { target_chapter_id: chapterId });
    } else {
      await supabase.rpc('increment_story_view', { target_story_id: storyId });
    }

    return { success: true };
  } catch (error) {
    console.error("View tracking error:", error);
    return { success: false };
  }
}
