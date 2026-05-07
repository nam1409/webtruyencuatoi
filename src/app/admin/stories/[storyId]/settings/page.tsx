import { getStoryById } from "@/actions/stories";
import { StoryForm } from "@/app/admin/components/StoryForm";
import { getSiteSettings } from "@/actions/settings";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ storyId: string }>;
}

export default async function StorySettingsPage({ params }: PageProps) {
  const { storyId } = await params;
  const [story, settings] = await Promise.all([
    getStoryById(storyId),
    getSiteSettings()
  ]);

  if (!story) notFound();

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 pb-20">
      <div className="container max-w-[1200px] mx-auto px-0 md:px-4 py-4 md:py-8">
        <StoryForm initialData={story} isEditing={true} availableGenres={settings.site_genres || []} />
      </div>
    </div>
  );
}
