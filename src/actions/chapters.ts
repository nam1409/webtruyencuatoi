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
  // console.log(`Server: Updating chapter ${id}`, JSON.stringify(updates, null, 2));
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

  // Notify followers if published
  if (updates.status === 'published' && data) {
    import("@/actions/follows").then(({ notifyFollowers }) => {
      notifyFollowers(data.story_id, data.title);
    });
  }

  revalidatePath(`/admin/editor/${id}`);
  if (data?.stories?.slug && data?.slug) {
    revalidatePath(`/truyen/${data.stories.slug}/${data.slug}`);
    revalidatePath(`/truyen/${data.stories.slug}`);
  }
  return data;
}

/**
 * Lưu một điểm khôi phục (Snapshot) cho phiên bản (Track) hiện tại
 */
export async function saveVersionSnapshot(versionId: string, content: any, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Lưu vào lịch sử
  const { error: historyError } = await supabase
    .from("chapter_version_history")
    .insert({
      version_id: versionId,
      content_json: content,
      note,
      created_by: user.id
    });

  if (historyError) throw new Error(historyError.message);

  // 2. Cập nhật trạng thái hiện tại của phiên bản (Track)
  const { error: versionError } = await supabase
    .from("chapter_versions")
    .update({ 
      content_draft: content,
      updated_at: new Date().toISOString()
    })
    .eq("id", versionId);

  if (versionError) throw new Error(versionError.message);

  return { success: true };
}

/**
 * Tạo một phiên bản (Track) mới
 */
export async function createChapterVersion(chapterId: string, name: string, initialContent?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("chapter_versions")
    .insert({
      chapter_id: chapterId,
      name,
      content_json: initialContent || { type: "doc", content: [] },
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath(`/admin/editor/${chapterId}`);
  return data;
}

/**
 * Cập nhật nội dung cho phiên bản (Track) - Dùng cho Autosave
 */
export async function updateVersionContent(versionId: string, content: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chapter_versions")
    .update({ 
      content_draft: content,
      updated_at: new Date().toISOString()
    })
    .eq("id", versionId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Xuất bản nội dung nháp của một phiên bản thành nội dung công khai
 */
export async function publishVersionTrack(versionId: string) {
  const supabase = await createClient();
  
  // 1. Lấy draft hiện tại
  const { data: version } = await supabase
    .from("chapter_versions")
    .select("content_draft, chapter_id")
    .eq("id", versionId)
    .single();

  if (!version?.content_draft) throw new Error("Không có nội dung nháp để xuất bản");

  // 2. Cập nhật vào content_json
  const { error } = await supabase
    .from("chapter_versions")
    .update({ 
      content_json: version.content_draft,
      status: 'published',
      updated_at: new Date().toISOString()
    })
    .eq("id", versionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/editor/${version.chapter_id}`);
  return { success: true };
}

export async function publishChapter(id: string, versionId?: string) {
  const supabase = await createClient();
  
  let contentToPublish: any = null;

  if (versionId) {
    // 1. Lấy nội dung từ phiên bản cụ thể (Lấy từ DRAFT của phiên bản đó)
    const { data: version } = await supabase
      .from("chapter_versions")
      .select("content_draft, content_json")
      .eq("id", versionId)
      .single();
    
    contentToPublish = version?.content_draft || version?.content_json;

    // 1b. Cập nhật chính nó thành nội dung đã xuất bản
    if (versionId) {
      await supabase.from("chapter_versions").update({ 
        content_json: contentToPublish,
        status: 'published' 
      }).eq("id", versionId);
    }
  } else {
    // 2. Nếu không chỉ định, lấy từ draft
    const { data: chapter } = await supabase.from("chapters").select("content_draft").eq("id", id).single();
    contentToPublish = chapter?.content_draft;
  }

  if (!contentToPublish) throw new Error("Không có nội dung để xuất bản");

  const { data, error } = await supabase
    .from("chapters")
    .update({
      status: 'published',
      content_json: contentToPublish, 
      published_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*, stories(slug)")
    .single();

  if (error) {
    console.error("Publish Error Details:", error);
    throw new Error(`Failed to publish chapter: ${error.message}`);
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

/**
 * Cập nhật trạng thái hiển thị của một phiên bản
 */
export async function updateVersionStatus(versionId: string, status: 'draft' | 'published') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_versions")
    .update({ status })
    .eq("id", versionId)
    .select("chapter_id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/editor/${data.chapter_id}`);
  return data;
}

/**
 * Đặt một phiên bản làm bản mặc định (Primary)
 */
export async function setPrimaryVersion(versionId: string) {
  const supabase = await createClient();
  
  // Lấy chapter_id trước
  const { data: vData } = await supabase
    .from("chapter_versions")
    .select("chapter_id")
    .eq("id", versionId)
    .single();
    
  if (!vData) throw new Error("Không tìm thấy phiên bản");

  // Update logic: Cập nhật is_primary = true cho bản này
  // (Trigger trong DB sẽ tự động gỡ is_primary của các bản khác)
  const { error } = await supabase
    .from("chapter_versions")
    .update({ is_primary: true, status: 'published' }) // Primary thì nên là published luôn
    .eq("id", versionId);

  if (error) throw new Error(error.message);
  
  revalidatePath(`/admin/editor/${vData.chapter_id}`);
  return { success: true };
}

export async function getChapterVersions(chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_versions")
    .select("*, profiles!chapter_versions_edited_by_fkey(display_name)")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching chapter versions:", error);
    return [];
  }
  return data;
}

export async function getVersionHistory(versionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_version_history")
    .select("*, profiles(display_name)")
    .eq("version_id", versionId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function restoreVersionToDraft(chapterId: string, content: any) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .update({ content_draft: content })
    .eq("id", chapterId)
    .select()
    .single();

  if (error) throw new Error("Restore failed");

  revalidatePath(`/admin/editor/${chapterId}`);
  return data;
}

export async function getChapterBySlug(storySlug: string, chapterSlug: string) {
  const supabase = await createClient();

  // 1. Lấy thông tin chương và thông tin câu chuyện
  const { data: chapter, error: cError } = await supabase
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

  if (cError || !chapter) return null;

  // 2. Lấy nội dung từ phiên bản Primary
  const { data: primaryVersion } = await supabase
    .from("chapter_versions")
    .select("content_json")
    .eq("chapter_id", chapter.id)
    .eq("status", "published")
    .eq("is_primary", true)
    .single();

  // 3. Fallback về content_json cũ nếu chưa migration hết
  const content = primaryVersion?.content_json || chapter.content_json;

  const result = {
    ...chapter,
    content_json: content
  };

  // Security Check: If private, verify access
  if (result.stories.is_private) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return result;

    // Author access
    if (result.stories.author_id === user.id) return result;

    // Collaborator access
    const { data: collab } = await supabase
      .from("story_collaborators")
      .select("id")
      .eq("story_id", result.stories.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (collab) return result;

    // Whitelist access
    const { data: access } = await supabase
      .from("story_access_list")
      .select("id")
      .eq("story_id", result.stories.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!access) return null;
  }

  return result;
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

export async function createChapter(storyId: string, title: string, slug: string, volumeId?: string | null, content?: any, versionName: string = "Bản thảo gốc") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Lấy order_index lớn nhất hiện tại
  const { data: lastChapter } = await supabase
    .from("chapters")
    .select("order_index")
    .eq("story_id", storyId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrderIndex = lastChapter ? (lastChapter.order_index + 1) : 1;
  const initialContent = content || { type: "doc", content: [] };

  // 2. Tạo bản ghi Chapter chính
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .insert({
      story_id: storyId,
      volume_id: volumeId || null,
      title,
      slug,
      order_index: nextOrderIndex,
      // Vẫn giữ để tương thích ngược, nhưng ưu tiên hệ thống version mới
      content_json: initialContent,
      content_draft: initialContent,
      status: "draft"
    })
    .select()
    .single();

  if (chapterError) throw new Error(chapterError.message);

  // 3. TỰ ĐỘNG TẠO PHIÊN BẢN (TRACK) ĐẦU TIÊN
  const { data: version, error: versionError } = await supabase
    .from("chapter_versions")
    .insert({
      chapter_id: chapter.id,
      name: versionName,
      content_json: initialContent,
      status: "draft",
      is_primary: true,
      created_by: user?.id
    })
    .select()
    .single();

  if (versionError) throw new Error(`Failed to create initial version: ${versionError.message}`);

  if (!versionError && version && user) {
    // 4. Tự động tạo điểm khôi phục đầu tiên nếu có nội dung
    await supabase.from("chapter_version_history").insert({
      version_id: version.id,
      content_json: initialContent,
      note: "Khởi tạo tự động (EPUB/Manual)",
      created_by: user.id
    });
  }

  // Log activity
  await logActivity(
    "publish_chapter",
    "chapter",
    chapter.id,
    `Đã tạo chương mới: ${title}`
  );

  revalidatePath(`/admin/stories/${storyId}`);
  return chapter;
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

  // Notify followers if publishing
  if (updates.status === 'published' && chapterIds.length > 0) {
    // Get the first chapter to find its title (simplified)
    const { data: chapter } = await supabase
      .from("chapters")
      .select("title")
      .eq("id", chapterIds[0])
      .single();
    
    if (chapter) {
      import("@/actions/follows").then(({ notifyFollowers }) => {
        notifyFollowers(storyId, chapterIds.length > 1 ? `${chapter.title} và ${chapterIds.length - 1} chương khác` : chapter.title);
      });
    }
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

export async function getChaptersContentByStory(storyId: string) {
  const supabase = await createClient();
  
  // 1. Get published chapters
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, title, content_json, order_index, slug")
    .eq("story_id", storyId)
    .eq("status", "published")
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching chapters content:", error);
    return [];
  }

  // 2. Fetch contents from Primary Versions for each chapter
  const chaptersWithVersionContent = await Promise.all(chapters.map(async (chapter) => {
    const { data: primaryVersion } = await supabase
      .from("chapter_versions")
      .select("content_json")
      .eq("chapter_id", chapter.id)
      .eq("status", "published")
      .eq("is_primary", true)
      .single();
    
    return {
      ...chapter,
      content_json: primaryVersion?.content_json || chapter.content_json
    };
  }));

  return chaptersWithVersionContent;
}
