import { getStoryBySlug } from "@/actions/stories";
import { getChaptersByStory } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";

export async function generateMetadata(
  { params }: { params: Promise<{ storySlug: string }> }
): Promise<Metadata> {
  const { storySlug } = await params;
  const story = await getStoryBySlug(storySlug);

  if (!story) return {};

  const title = story.title;
  const description = story.description || `Đọc truyện ${story.title} bản đầy đủ, cập nhật mới nhất tại ZenStory.`;
  const image = story.cover_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: image ? [image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}
import { 
  Tag,
  Users,
  Feather,
  Globe,
  BookOpen,
  Play,
  Star,
  Layers,
  FileText,
  Calendar,
  Clock,
  ChevronRight
} from "lucide-react";
import { getCollaborators } from "@/actions/collaborators";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getSiteSettings } from "@/actions/settings";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { getStoryRating } from "@/actions/ratings";
import { RatingSystem } from "@/components/story/RatingSystem";
import { ViewCounter } from "@/features/reader/components/ViewCounter";
import { FollowButton } from "@/components/story/FollowButton";
import { DownloadStoryButton } from "@/components/story/DownloadStoryButton";

export default async function StoryDetailPage({ params }: { params: Promise<{ storySlug: string }> }) {
  const { storySlug } = await params;
  const story = await getStoryBySlug(storySlug);
  const settings = await getSiteSettings();
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Fetch full profile with role
  let user = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    user = profile ? { ...authUser, ...profile } : authUser;
  }
  
  if (!story) {
    notFound();
  }

  const [allChapters, volumes, ratingData, collaborators] = await Promise.all([
    getChaptersByStory(story.id, true),
    getVolumesByStory(story.id),
    getStoryRating(story.id),
    getCollaborators(story.id)
  ]);

  // Chapters are already filtered by the action
  const chapters = allChapters;

  // Group chapters by volume
  const groupedChapters = volumes.map(volume => ({
    ...volume,
    chapters: chapters.filter(c => c.volume_id === volume.id).sort((a, b) => a.order_index - b.order_index)
  })).sort((a, b) => a.order_index - b.order_index);

  const orphanChapters = chapters.filter(c => !c.volume_id).sort((a, b) => a.order_index - b.order_index);

  const firstChapter = chapters.sort((a, b) => a.order_index - b.order_index)[0];

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="flex flex-col min-h-screen bg-background" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />
      <ViewCounter storyId={story.id} />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": story.title,
            "description": story.description,
            "image": story.cover_url,
            "author": {
              "@type": "Person",
              "name": story.profiles?.display_name || "Tác giả ẩn danh"
            },
            "genre": story.genres,
            "datePublished": story.created_at,
            "publisher": {
              "@type": "Organization",
              "name": settings?.site_name || "ZenStory"
            }
          })
        }}
      />

      <main className="flex-1 pb-24">
      {/* Hero Banner Area */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        {story.cover_url && (
          <div className="absolute inset-0">
            <img src={story.cover_url} alt="Banner" className="w-full h-full object-cover blur-2xl opacity-30 scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
          </div>
        )}
        
        <div className="container max-w-6xl mx-auto px-4 h-full relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 pb-12">
          {/* Cover Image */}
          <div className="w-full max-w-[240px] aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40 border-4 border-background transform -rotate-1">
            {story.cover_url ? (
              <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-black text-muted-foreground/20 italic">
                {story.title[0]}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {story.genres?.map((g: string) => (
                <span key={g} className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  {g}
                </span>
              ))}
              <span className="px-4 py-1.5 bg-muted/50 text-muted-foreground rounded-full text-[10px] font-black uppercase tracking-widest border border-border">
                {story.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">{story.title}</h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Người đăng</span>
                    <span className="text-sm font-bold text-foreground">{story.profiles?.display_name || "Thành viên"}</span>
                  </div>
                </div>
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  {chapters.length} chương
                </div>
              </div>
              
              <div className="hidden md:block w-px h-8 bg-border/50" />
              
              <RatingSystem storyId={story.id} initialRating={ratingData} userId={user?.id} />
            </div>
          </div>
        </div>

      {/* Content Tabs/Grid */}
      <div className="container max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        {/* Left: Description and Chapters */}
        <div className="lg:col-span-2 space-y-12">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 p-6 bg-muted/20 rounded-[2.5rem] border border-border/50">
            {firstChapter ? (
              <Link href={`/truyen/${story.slug}/${firstChapter.slug}`} className="flex-1">
                <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">
                  <Play className="w-5 h-5 fill-current" /> Đọc từ đầu
                </Button>
              </Link>
            ) : (
              <Button disabled className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest">Chưa có chương</Button>
            )}
            <FollowButton storyId={story.id} userId={user?.id} />
            <DownloadStoryButton 
              storyId={story.id} 
              storyTitle={story.title} 
              storySlug={story.slug}
              coverUrl={story.cover_url}
              allowOffline={story.allow_offline} 
            />
          </div>

          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Giới thiệu
            </h2>
            <div className="prose-reader text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium bg-muted/10 p-8 rounded-[2rem] border border-border/30 italic">
              {story.description || "Chưa có mô tả cho tác phẩm này."}
            </div>
          </section>

          {/* Table of Contents */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Mục lục
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {chapters.length} chương đã đăng
              </span>
            </div>

            <div className="space-y-10">
              {groupedChapters.map((volume) => (
                <div key={volume.id} className="space-y-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">{volume.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    {volume.chapters.map((chapter: any) => (
                      <ChapterItem key={chapter.id} chapter={chapter} storySlug={story.slug} />
                    ))}
                  </div>
                </div>
              ))}

              {orphanChapters.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-muted rounded-2xl border border-border">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chương lẻ / Phụ lục</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    {orphanChapters.map((chapter) => (
                      <ChapterItem key={chapter.id} chapter={chapter} storySlug={story.slug} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Metadata & Stats */}
        <aside className="space-y-8">
           <section className="bg-background rounded-[2.5rem] border border-border/50 p-8 space-y-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-border pb-4">Thông tin chi tiết</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  <Feather className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Tác giả gốc</p>
                  <p className="text-xs font-bold truncate max-w-[140px]">{story.author_name || "Đang cập nhật"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Nhóm dịch</p>
                  <p className="text-xs font-bold truncate max-w-[140px]">{story.translator_name || "Đang cập nhật"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Ngày đăng</p>
                  <p className="text-xs font-bold">{format(new Date(story.created_at), "dd/MM/yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Thẻ truyện</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {story.tags?.map((t: string) => (
                      <span key={t} className="text-[9px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Cập nhật cuối</p>
                  <p className="text-xs font-bold">Vừa mới xong</p>
                </div>
              </div>
            </div>
          </section>

          {/* Collaborators & Staff */}
          <section className="bg-background rounded-[2.5rem] border border-border/50 p-8 space-y-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-border pb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Nhân sự thực hiện
            </h2>
            
            <div className="space-y-4">
              {/* Uploader (Author) */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0">
                  <img src={story.profiles?.avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold truncate">{story.profiles?.display_name || "Thành viên"}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none">Uploader</p>
                </div>
              </div>

              {/* Other Collaborators */}
              {collaborators.map((collab: any) => (
                <div key={collab.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0">
                    <img src={collab.profiles?.avatar_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate">{collab.profiles?.display_name || collab.profiles?.username}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                      {collab.role || "Editor"}
                    </p>
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-[10px] font-medium text-muted-foreground italic">Chưa có cộng tác viên khác.</p>
              )}
            </div>
          </section>

          {/* Social / Donate (Simulated) */}
          <section className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Ủng hộ tác giả</h3>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-6">
              Tác phẩm này được sáng tác miễn phí. Hãy ủng hộ tác giả để họ có thêm động lực ra chương mới nhé!
            </p>
            <Button className="w-full rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">
              Tặng kẹo 🍬
            </Button>
          </section>
        </aside>
      </div>
      </main>
    </div>
  );
}

function ChapterItem({ chapter, storySlug }: { chapter: any, storySlug: string }) {
  return (
    <Link 
      href={`/truyen/${storySlug}/${chapter.slug}`}
      className="flex items-center justify-between p-4 bg-background hover:bg-muted rounded-xl border border-border/50 group transition-all"
    >
      <div className="space-y-1 overflow-hidden">
        <p className="text-xs font-bold group-hover:text-primary transition-colors truncate">{chapter.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          <Clock className="w-3 h-3" />
          {format(new Date(chapter.created_at), "dd/MM/yyyy")}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
