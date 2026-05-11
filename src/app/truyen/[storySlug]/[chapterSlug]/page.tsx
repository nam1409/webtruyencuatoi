import { getChapterBySlug, getChaptersByStory, getChapterVersions } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { getCommentCountsByParagraph } from "@/actions/comments";
import { getReadingProgress } from "@/actions/progress";
import { ReaderLayout } from "@/features/reader/components/ReaderLayout";
import { ViewCounter } from "@/features/reader/components/ViewCounter";
import { notFound } from "next/navigation";
import { ProtectedContent } from "@/features/reader/components/ProtectedContent";
import { OfflineSupport } from "@/features/reader/components/OfflineSupport";
import { getCharactersByStory } from "@/actions/characters";
import { Metadata } from "next";
import { ReaderProvider } from "@/features/reader/context/ReaderContext";

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: Promise<{ storySlug: string; chapterSlug: string }> }
): Promise<Metadata> {
  const { storySlug, chapterSlug } = await params;
  const chapter = await getChapterBySlug(storySlug, chapterSlug);

  if (!chapter) return {};

  const title = `${chapter.title} - ${chapter.stories.title}`;
  const description = `Đọc chương ${chapter.title} của truyện ${chapter.stories.title} mới nhất, nhanh nhất tại ZenStory.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ChapterPage({
  params,
  searchParams
}: {
  params: Promise<{ storySlug: string; chapterSlug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { storySlug, chapterSlug } = await params;
  const { v: versionId } = await searchParams;

  const chapter = await getChapterBySlug(storySlug, chapterSlug);

  if (!chapter) {
    notFound();
  }

  const isCanvasProtected = !!chapter.stories.is_protected;
  const hasPassword = !!chapter.password_hash;
  const isSecurityActive = chapter.is_anti_copy || isCanvasProtected || hasPassword;

  // Fetch all chapters, volumes, comment counts, progress, versions, and CHARACTERS in parallel
  // This is the most efficient way to get all required data for the reader
  const [allChapters, allVolumes, commentCounts, progress, rawVersions, characters, specificVersion] = await Promise.all([
    getChaptersByStory(chapter.story_id, true), // isPublic = true
    getVolumesByStory(chapter.story_id),
    getCommentCountsByParagraph(chapter.id),
    getReadingProgress(chapter.story_id),
    getChapterVersions(chapter.id),
    getCharactersByStory(chapter.story_id),
    // Fetch specific version content if requested (parallelized)
    versionId && versionId !== 'main' 
      ? (async () => {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          const { data } = await supabase
            .from("chapter_versions")
            .select("content_json")
            .eq("id", versionId)
            .eq("status", "published")
            .maybeSingle();
          return data?.content_json;
        })()
      : Promise.resolve(null)
  ]);

  // Determine display content
  const displayContent = specificVersion || chapter.content_json;

  // Apply Anti-Copy protection: CLEAN versions list to avoid leaking content in HTML props
  const publishedVersions = rawVersions
    .filter((v: any) => v.status === 'published')
    .map((v: any) => {
      // Remove content to prevent leaking to view-source
      const { content_json, content_draft, ...versionMetadata } = v;
      return versionMetadata;
    });

  // Add original version to selection list if public
  if (chapter.content_status === 'published') {
    publishedVersions.unshift({
      id: 'main',
      name: 'Bản gốc (Database)',
      is_primary: rawVersions.every((v: any) => !v.is_primary)
    });
  }

  // Default reader settings for SSR
  const defaultSettings = {
    fontSize: 18,
    font: 'font-sans',
    lineHeight: 1.6,
    paragraphSpacing: 24,
    containerPadding: 24,
  };

  return (
    <>
      <ViewCounter chapterId={chapter.id} />
      <ReaderLayout
        storyId={chapter.story_id}
        chapterId={chapter.id}
        storyTitle={chapter.stories.title}
        chapterTitle={chapter.title}
        chapters={allChapters}
        volumes={allVolumes}
        storySlug={storySlug}
        chapterSlug={chapterSlug}
        protectionEnabled={isCanvasProtected}
        initialScroll={progress?.chapter_id === chapter.id ? progress?.scroll_position : 0}
        versions={publishedVersions}
      >
        {isSecurityActive ? (
          <ProtectedContent
            chapterId={chapter.id}
            isProtected={isCanvasProtected}
            initialContent={null}
          />
        ) : (
          <OfflineSupport
            storyId={chapter.story_id}
            chapterId={chapter.id}
            // Không gửi content gốc nếu có bảo mật
            initialContent={isSecurityActive ? null : displayContent}
            settings={defaultSettings}
            commentCounts={commentCounts}
            characters={characters}
          />
        )}
      </ReaderLayout>
    </>
  );
}
