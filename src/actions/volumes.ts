"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getVolumesByStory(storyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volumes")
    .select("*")
    .eq("story_id", storyId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching volumes:", error);
    return [];
  }

  return data;
}

export async function createVolume(storyId: string, title: string) {
  const supabase = await createClient();
  
  // Get max order index
  const { data: lastVolume } = await supabase
    .from("volumes")
    .select("order_index")
    .eq("story_id", storyId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = lastVolume ? lastVolume.order_index + 1 : 1;

  const { data, error } = await supabase
    .from("volumes")
    .insert({
      story_id: storyId,
      title,
      order_index: nextOrder
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/stories/${storyId}/settings`);
  return data;
}

export async function updateVolume(id: string, storyId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("volumes")
    .update({ title })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/stories/${storyId}/settings`);
}

export async function deleteVolume(id: string, storyId: string) {
  const supabase = await createClient();
  // Chapters linked to this volume will have volume_id set to NULL due to SET NULL constraint
  const { error } = await supabase
    .from("volumes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/stories/${storyId}/settings`);
}

export async function reorderVolumes(storyId: string, volumeId: string, direction: 'up' | 'down') {
  const supabase = await createClient();
  const { data: volumes } = await supabase
    .from("volumes")
    .select("id, order_index")
    .eq("story_id", storyId)
    .order("order_index", { ascending: true });

  if (!volumes) return;

  const currentIndex = volumes.findIndex(v => v.id === volumeId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= volumes.length) return;

  const currentVolume = volumes[currentIndex];
  const targetVolume = volumes[targetIndex];

  // Swap order_index using individual updates to avoid constraint issues with upsert
  const { error: error1 } = await supabase
    .from("volumes")
    .update({ order_index: targetVolume.order_index })
    .eq("id", currentVolume.id);

  if (error1) throw new Error(error1.message);

  const { error: error2 } = await supabase
    .from("volumes")
    .update({ order_index: currentVolume.order_index })
    .eq("id", targetVolume.id);

  if (error2) throw new Error(error2.message);

  revalidatePath(`/admin/stories/${storyId}/settings`);
}
