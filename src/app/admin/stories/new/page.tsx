import { StoryForm } from "../../components/StoryForm";
import { getSiteSettings } from "@/actions/settings";

export default async function NewStoryPage() {
  const settings = await getSiteSettings();
  const genres = settings.site_genres || [];

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 pb-20">
      <div className="container max-w-[1200px] mx-auto px-4 py-8">
        <StoryForm availableGenres={genres} />
      </div>
    </div>
  );
}
