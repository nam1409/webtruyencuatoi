import { getChapterBySlug, getChaptersByStory, getChapterVersions } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { getCommentCountsByParagraph } from "@/actions/comments";
import { getReadingProgress } from "@/actions/progress";
import { ReaderLayout } from "@/features/reader/components/ReaderLayout";
import { ViewCounter } from "@/features/reader/components/ViewCounter";
import { notFound } from "next/navigation";
import { ProtectedContent } from "@/features/reader/components/ProtectedContent";
import { StaticContent } from "@/features/reader/components/StaticContent";
import { Metadata } from "next";
import { OfflineSupport } from "@/features/reader/components/OfflineSupport";

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

  // If a specific version is requested, we need to fetch its content
  let displayContent = chapter.content_json;
  if (versionId) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: vData } = await supabase
      .from("chapter_versions")
      .select("content_json")
      .eq("id", versionId)
      .eq("status", "published")
      .single();
    if (vData) {
      displayContent = vData.content_json;
    }
  }

  // Fetch all chapters, volumes, comment counts, progress, and VERSIONS
  const [allChapters, allVolumes, commentCounts, progress, versions] = await Promise.all([
    getChaptersByStory(chapter.story_id),
    getVolumesByStory(chapter.story_id),
    getCommentCountsByParagraph(chapter.id),
    getReadingProgress(chapter.story_id),
    getChapterVersions(chapter.id) // Only published ones will be shown in UI later
  ]);

  const publishedVersions = versions.filter((v: any) => v.status === 'published');

  const isCanvasProtected = chapter.stories.is_protected;
  const hasPassword = !!chapter.password_hash;
  const showProtected = isCanvasProtected || hasPassword;

  // Default reader settings for SSR
  const defaultSettings = {
    fontSize: 18,
    font: 'font-serif',
    lineHeight: 1.6,
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
        {showProtected ? (
          <ProtectedContent
            chapterId={chapter.id}
            isProtected={isCanvasProtected}
          />
        ) : (
          <OfflineSupport
            storyId={chapter.story_id}
            chapterId={chapter.id}
            initialContent={displayContent}
            settings={defaultSettings}
            commentCounts={commentCounts}
          />
        )}
      </ReaderLayout>
    </>
  );
}
