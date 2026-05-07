"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";

export async function getChapter(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("*, stories(title, slug)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }

  // JIT Profile creation if missing (to prevent FK errors on versioning)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        username: user.email?.split("@")[0] || `user_${user.id.slice(0, 5)}`,
        display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
      });

      if (insertError) {
        console.error("Failed to auto-create profile in getChapter:", insertError);
      }
    }
  }

  return data;
}

export async function updateChapter(id: string, updates: any) {
  console.log(`Server: Updating chapter ${id}`, JSON.stringify(updates, null, 2));
  const supabase = await createClient();

  // Map content updates to content_draft to prevent live leaking
  const mappedUpdates = { ...updates };
  if (mappedUpdates.content_json) {
    mappedUpdates.content_draft = mappedUpdates.content_json;
    delete mappedUpdates.content_json;
  }

  const { data, error } = await supabase
    .from("chapters")
    .update(mappedUpdates)
    .eq("id", id)
    .select("*, stories(slug)")
    .single();

  if (error) {
    console.error("Error updating chapter:", error);
    throw new Error("Failed to update chapter");
  }

  revalidatePath(`/admin/editor/${id}`);
  if (data?.stories?.slug && data?.slug) {
    revalidatePath(`/truyen/${data.stories.slug}/${data.slug}`);
    revalidatePath(`/truyen/${data.stories.slug}`);
  }
  return data;
}

export async function publishChapter(id: string) {
  const supabase = await createClient();

  // 1. Get the latest draft
  const { data: chapter } = await supabase.from("chapters").select("content_draft").eq("id", id).single();

  if (!chapter) throw new Error("Chapter not found");

  // 2. Sync draft to published content and update status
  const { data, error } = await supabase
    .from("chapters")
    .update({
      status: 'published',
      content_json: chapter.content_draft, // Sync draft to live
      published_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*, stories(slug)")
    .single();

  if (error) {
    console.error("Error publishing chapter:", error);
    throw new Error("Failed to publish chapter");
  }

  if (process.env.UPSTASH_REDIS_REST_URL) {
    await redis.del(`chapter_content:${id}`);
  }

  revalidatePath(`/admin/editor/${id}`);
  revalidatePath(`/admin/stories/${data.story_id}`);
  if (data?.stories?.slug && data?.slug) {
    revalidatePath(`/truyen/${data.stories.slug}/${data.slug}`);
    revalidatePath(`/truyen/${data.stories.slug}`);
  }
  return data;
}

export async function getChapterVersions(chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_versions")
    .select("*, profiles(display_name)")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching chapter versions:", error);
    return [];
  }

  return data;
}

export async function rollbackChapterVersion(chapterId: string, versionId: string) {
  const supabase = await createClient();

  // 1. Get the version content
  const { data: version, error: versionError } = await supabase
    .from("chapter_versions")
    .select("content_json")
    .eq("id", versionId)
    .single();

  if (versionError || !version) {
    throw new Error("Could not find version content");
  }

  // 2. Update the chapter with this content
  const { data, error } = await supabase
    .from("chapters")
    .update({ content_json: version.content_json })
    .eq("id", chapterId)
    .select()
    .single();

  if (error) {
    console.error("Error rolling back version:", error);
    throw new Error("Rollback failed");
  }

  if (process.env.UPSTASH_REDIS_REST_URL) {
    await redis.del(`chapter_content:${chapterId}`);
  }

  revalidatePath(`/admin/editor/${chapterId}`);
  return data;
}

export async function getChapterBySlug(storySlug: string, chapterSlug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select(`
      *,
      stories!inner (id, title, slug, is_protected, is_private, author_id)
    `)
    .eq("slug", chapterSlug)
    .eq("stories.slug", storySlug)
    .eq("status", "published")
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .single();

  if (error || !data) return null;

  // Security Check: If private, verify access
  if (data.stories.is_private) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return data;

    // Author access
    if (data.stories.author_id === user.id) return data;

    // Collaborator access
    const { data: collab } = await supabase
      .from("story_collaborators")
      .select("id")
      .eq("story_id", data.stories.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (collab) return data;

    // Whitelist access
    const { data: access } = await supabase
      .from("story_access_list")
      .select("id")
      .eq("story_id", data.stories.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!access) return null;
  }

  return data;
}

export async function getChaptersByStory(storyId: string, isPublic: boolean = false) {
  const supabase = await createClient();
  let query = supabase
    .from("chapters")
    .select(`
      id, story_id, volume_id, title, slug, order_index, status, published_at, created_at, updated_at, scheduled_at,
      view_count,
      comments(count)
    `)
    .eq("story_id", storyId);
  
  if (isPublic) {
    query = query
      .eq("status", "published")
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`);
  }

  const { data, error } = await query.order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return data;
}

import { logActivity } from "@/actions/admin";

export async function createChapter(storyId: string, title: string, slug: string, volumeId?: string | null, content?: any) {
  const supabase = await createClient();

  // Get the current max order_index
  const { data: lastChapter } = await supabase
    .from("chapters")
    .select("order_index")
    .eq("story_id", storyId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrderIndex = lastChapter ? (lastChapter.order_index + 1) : 1;
  const initialContent = content || { type: "doc", content: [] };

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      story_id: storyId,
      volume_id: volumeId || null,
      title,
      slug,
      order_index: nextOrderIndex,
      content_json: initialContent,
      content_draft: initialContent,
      status: "draft"
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chapter:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    "publish_chapter",
    "chapter",
    data.id,
    `Đã tạo chương mới: ${title}`
  );

  revalidatePath(`/admin/stories/${storyId}`);
  return data;
}

export async function deleteChapter(id: string, storyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (process.env.UPSTASH_REDIS_REST_URL) {
    await redis.del(`chapter_content:${id}`);
  }

  revalidatePath(`/admin/stories/${storyId}`);
}

export async function reorderChapters(storyId: string, chapterId: string, direction: 'up' | 'down') {
  const supabase = await createClient();
  
  // Get chapter to find its volume_id
  const { data: currentChapter } = await supabase.from("chapters").select("volume_id, order_index").eq("id", chapterId).single();
  if (!currentChapter) return;

  // Get all chapters in the same context (same volume or same orphan status)
  let query = supabase.from("chapters").select("id, order_index").eq("story_id", storyId);
  if (currentChapter.volume_id) {
    query = query.eq("volume_id", currentChapter.volume_id);
  } else {
    query = query.is("volume_id", null);
  }

  const { data: chapters } = await query.order("order_index", { ascending: true });
  if (!chapters) return;

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= chapters.length) return;

  const targetChapter = chapters[targetIndex];

  // Swap order_index using individual updates to avoid constraint issues with upsert
  const { error: error1 } = await supabase
    .from("chapters")
    .update({ order_index: targetChapter.order_index })
    .eq("id", chapterId);

  if (error1) throw new Error(error1.message);

  const { error: error2 } = await supabase
    .from("chapters")
    .update({ order_index: currentChapter.order_index })
    .eq("id", targetChapter.id);

  if (error2) throw new Error(error2.message);

  revalidatePath(`/admin/stories/${storyId}`);
}

export async function bulkUpdateChapters(chapterIds: string[], updates: any, storyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chapters")
    .update(updates)
    .in("id", chapterIds);

  if (error) {
    console.error("Error bulk updating chapters:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    "bulk_update_chapters",
    "story",
    storyId,
    `Đã cập nhật hàng loạt ${chapterIds.length} chương`
  );

  revalidatePath(`/admin/stories/${storyId}`);
}

export async function bulkDeleteChapters(chapterIds: string[], storyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chapters")
    .delete()
    .in("id", chapterIds);

  if (error) {
    console.error("Error bulk deleting chapters:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    "bulk_delete_chapters",
    "story",
    storyId,
    `Đã xóa hàng loạt ${chapterIds.length} chương`
  );

  revalidatePath(`/admin/stories/${storyId}`);
}
