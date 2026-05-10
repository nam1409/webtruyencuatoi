import { 
  Search, ChevronRight, BookOpen, Star, Zap, PenTool, 
  Shield, Clock, BarChart3, Trophy, Tag, Megaphone, Sparkles, Info 
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings, getSiteStats } from "@/actions/settings";
import { renderTiptapContent } from "@/lib/renderer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getNews } from "@/actions/news";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { OfflineLibrary } from "@/components/home/OfflineLibrary";
import { getShoutboxMessages } from "@/actions/shoutbox";
import { Shoutbox } from "@/components/shoutbox/Shoutbox";
import { Section } from "@/components/home/Section";
import { SectionHeader } from "@/components/home/SectionHeader";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

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

  // Get layout configuration
  const layout = settings?.homepage_layout || [
    { type: 'hero', id: 'h1', enabled: true },
    { type: 'news', id: 'n1', enabled: true, title: 'Bản tin ZenBoard' },
    { type: 'shoutbox', id: 'sb1', enabled: true },
    { type: 'latest', id: 'l1', enabled: true, title: 'Mới cập nhật', limit: 12 },
    { type: 'popular', id: 'p1', enabled: true, title: 'Tác phẩm phổ biến', limit: 6 }
  ];

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="flex flex-col min-h-screen bg-background" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />

      <main className="flex-1">
        <OfflineLibrary />
        {layout.map((section: any) => {
          if (!section.enabled) return null;

          switch (section.type) {
            case 'hero':
              return <HeroSection key={section.id} settings={settings} section={section} />;
            case 'latest':
              return <LatestSection key={section.id} section={section} supabase={supabase} />;
            case 'popular':
              return <PopularSection key={section.id} section={section} supabase={supabase} title={section.title || "Tác phẩm phổ biến"} />;
            case 'trending':
              return <PopularSection key={section.id} section={section} supabase={supabase} title={section.title || "Đang thịnh hành"} isTrending />;
            case 'custom':
              return <CustomSection key={section.id} section={section} />;
            case 'genres':
              return <GenresSection key={section.id} section={section} settings={settings} />;
            case 'stats':
              return <StatsSection key={section.id} />;
            case 'news':
              return <ZenBoard key={section.id} section={section} />;
            case 'shoutbox':
              if (!settings?.enable_shoutbox) return null;
              return <ShoutboxSection key={section.id} user={user} isAdmin={user?.role === 'admin'} />;
            default:
              return null;
          }
        })}
      </main>

      <footer className="py-16 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
               <h2 className="text-xl font-black italic tracking-tighter">{settings?.site_name || "ZenStory"}</h2>
               <p className="text-sm text-muted-foreground/60 max-w-xs text-center md:text-left">Nền tảng đọc và sáng tác truyện chữ hiện đại dành cho cộng đồng sáng tạo.</p>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              <Link href="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Bảo mật</Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 italic">© 2026 {settings?.site_name || "ZenStory"} Platform • Crafted with Zen</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Refactored Components ---

async function HeroSection({ settings, section }: { settings: any, section: any }) {
  const heroTitle = section.title || settings?.hero_title || "Nơi những câu chuyện bắt đầu";
  const heroSubtitle = section.subtitle || settings?.hero_subtitle || "ZenStory là nền tảng đọc và sáng tác truyện chữ hiện đại, nơi tinh hoa văn học hội tụ.";
  const heroImage = section.imageUrl || settings?.hero_image_url;

  return (
    <section className="relative overflow-hidden border-b border-border">
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image src={heroImage} alt="Hero" fill priority unoptimized className="object-cover opacity-[0.03] grayscale" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-background to-background" />

      <div className="container relative z-10 mx-auto px-4 py-28 sm:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/50 px-4 py-2 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {settings?.site_name || "ZenStory"} Premium
            </span>
          </div>

          <h1 className="mt-10 text-5xl sm:text-8xl font-black tracking-tight leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700">
            {heroTitle}
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground/80 font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {heroSubtitle}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/truyen">
              <Button size="lg" className="h-14 rounded-2xl px-10 font-bold text-xs uppercase tracking-widest shadow-2xl shadow-primary/20">
                Khám phá truyện
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-14 rounded-2xl px-10 font-bold text-xs uppercase tracking-widest border-2 hover:bg-muted/50 transition-all">
                Bắt đầu sáng tác
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ story }: { story: any }) {
  const chapterCount = story.chapters?.[0]?.count || 0;
  const views = story.views_count_total || 0;
  const formattedViews = Intl.NumberFormat("vi-VN", { notation: 'compact' }).format(views);

  const ratings = story.ratings || [];
  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  const updatedTime = story.updated_at 
    ? formatDistanceToNow(new Date(story.updated_at), { addSuffix: true, locale: vi })
    : null;

  return (
    <Link href={`/truyen/${story.slug}`} className="group block h-full">
      <div className="flex flex-col h-full overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30">
        {/* Cover Image Area */}
        <div className="relative aspect-[3/4.2] overflow-hidden">
          {story.cover_url ? (
            <Image
              src={story.cover_url}
              alt={story.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20">
              <BookOpen className="h-10 w-10 text-muted-foreground/10" />
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
            {story.is_protected && (
              <div className="p-1.5 rounded-lg bg-amber-400 text-amber-950 shadow-lg border border-amber-300/50" title="Elite Protected">
                <Shield className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
            {story.status === "completed" && (
              <div className="rounded-md bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-white shadow-lg border border-white/10">
                Full
              </div>
            )}
          </div>

          {/* Rating Always Visible */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold flex items-center gap-1 shadow-xl">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {averageRating}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        </div>

        {/* Rich Content Section */}
        <div className="flex flex-col flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary/70 uppercase tracking-widest">
                <span className="truncate max-w-[70px]">{story.genres?.[0] || "Novel"}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{chapterCount} ch</span>
              </div>
              {updatedTime && (
                <span className="text-[8px] font-medium text-muted-foreground/40 italic shrink-0">
                  {updatedTime}
                </span>
              )}
            </div>

            <h3 className="line-clamp-1 text-base font-bold leading-tight transition-colors group-hover:text-primary">
              {story.title}
            </h3>
          </div>

          {/* Description Excerpt */}
          {story.description && (
            <p className="line-clamp-2 text-[10px] text-muted-foreground/70 leading-relaxed font-medium">
              {story.description.replace(/<[^>]*>/g, '')}
            </p>
          )}

          {/* Tags Chips */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[7px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="mt-auto pt-3 border-t border-border/5 flex items-center justify-between text-[10px] text-muted-foreground/50 font-bold uppercase tracking-tight">
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-2.5 h-2.5 text-primary/60" />
              </div>
              <span className="truncate hover:text-primary transition-colors">
                {story.profiles?.display_name || "Ẩn danh"}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <BarChart3 className="h-2.5 w-2.5" />
              {formattedViews}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

async function LatestSection({ section, supabase }: { section: any, supabase: any }) {
  const { data: stories } = await supabase
    .from("stories")
    .select(`*, profiles:author_id (display_name, avatar_url), chapters:chapters(count)`)
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .limit(section.limit || 12)
    .order("created_at", { ascending: false });

  return (
    <Section id="latest">
      <SectionHeader 
        eyebrow="Cập nhật mới"
        title={section.title || "Tác phẩm mới nhất"}
        action={
          <Link href="/truyen">
            <Button variant="outline" className="rounded-xl font-bold text-[10px] uppercase tracking-widest border-2">
              Xem tất cả <ChevronRight className="ml-1 w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
        {stories?.map((story: any) => <StoryCard key={story.id} story={story} />)}
      </div>
    </Section>
  );
}

async function PopularSection({ section, supabase, title, isTrending }: { section: any, supabase: any, title: string, isTrending?: boolean }) {
  const { data: stories } = await supabase
    .from("stories")
    .select(`*, profiles:author_id (display_name, avatar_url), chapters:chapters(count)`)
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .limit(section.limit || 6)
    .order(isTrending ? "updated_at" : "views_count_total", { ascending: false });

  return (
    <Section muted={isTrending}>
      <SectionHeader 
        eyebrow={isTrending ? "Trending" : "Popular"}
        title={title}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
        {stories?.map((story: any) => <StoryCard key={story.id} story={story} />)}
      </div>
    </Section>
  );
}

async function StatsSection() {
  const stats = await getSiteStats();
  const items = [
    { label: "Tác phẩm", value: stats.stories, icon: BookOpen },
    { label: "Người dùng", value: stats.users, icon: Star },
    { label: "Bình luận", value: stats.comments, icon: Zap },
    { label: "Chương truyện", value: stats.chapters, icon: PenTool },
  ];

  return (
    <Section muted>
      <div className="rounded-[3rem] border border-border/50 bg-background/50 p-10 sm:p-20 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center space-y-4 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <item.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-4xl sm:text-6xl font-black tracking-tighter italic">
                  {Intl.NumberFormat("vi-VN", { notation: 'compact' }).format(item.value)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function GenresSection({ settings, section }: { settings: any, section: any }) {
  const genres = settings?.site_genres || [];

  return (
    <Section>
      <SectionHeader eyebrow="Thể loại" title={section.title || "Khám phá thế giới"} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {genres.map((genre: string) => (
          <Link key={genre} href={`/truyen?genre=${encodeURIComponent(genre)}`} className="group p-8 rounded-3xl border border-border/50 bg-card/30 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all text-center">
            <span className="font-bold text-sm text-muted-foreground group-hover:text-primary transition-colors">{genre}</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

async function ZenBoard({ section }: { section: any }) {
  const news = await getNews(5);
  const categories = ["Thông báo", "Cập nhật", "Sự kiện"];

  return (
    <Section muted className="relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
        <Megaphone className="w-96 h-96 -rotate-12" />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-20">
        <div className="lg:w-1/3">
          <SectionHeader eyebrow="Tin tức" title={section.title || "ZenBoard"} description="Cập nhật nhanh nhất các thông báo quan trọng và sự kiện cộng đồng." />
          <Link href="/news">
            <Button className="h-14 rounded-2xl px-10 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Toàn bộ tin tức</Button>
          </Link>
        </div>

        <div className="lg:w-2/3 space-y-6">
          {news.map((item: any) => (
            <Link key={item.id} href={`/news/${item.id}`} className="flex items-center gap-6 p-8 bg-card/40 rounded-[2rem] border border-border/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/30 uppercase">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

async function ShoutboxSection({ user, isAdmin }: { user: any, isAdmin: boolean }) {
  const initialMessages = await getShoutboxMessages(50);
  return (
    <Section>
      <SectionHeader eyebrow="Cộng đồng" title="Trò chuyện trực tiếp" />
      <div className="bg-card/40 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden">
        <Shoutbox initialMessages={initialMessages} currentUser={user} isAdmin={isAdmin} />
      </div>
    </Section>
  );
}

function CustomSection({ section }: { section: any }) {
  if (!section.content) return null;
  return (
    <Section>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {renderTiptapContent(section.content)}
      </div>
    </Section>
  );
}
