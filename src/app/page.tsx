import { BookOpen, PenTool, Zap, Shield, ChevronRight, Star, BarChart3, Trophy, Tag, Megaphone, Sparkles, Clock, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/actions/settings";
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

  // Get layout configuration, fallback to default if empty
  const layout = settings?.homepage_layout || [
    { type: 'hero', id: 'h1', enabled: true },
    { type: 'news', id: 'n1', enabled: true, title: 'ZenBoard' },
    { type: 'latest', id: 'l1', enabled: true, title: 'Mới Cập Nhật', limit: 12 },
    { type: 'popular', id: 'p1', enabled: true, title: 'Truyện Hot', limit: 6 }
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
              return <PopularSection key={section.id} section={section} supabase={supabase} title={section.title || "Truyện Hot"} />;
            case 'trending':
              return <PopularSection key={section.id} section={section} supabase={supabase} title={section.title || "Đang Thịnh Hành"} isTrending />;
            case 'custom':
              return <CustomSection key={section.id} section={section} />;
            case 'genres':
              return <GenresSection key={section.id} section={section} settings={settings} />;
            case 'stats':
              return <StatsSection key={section.id} />;
            case 'news':
              return <ZenBoard key={section.id} section={section} />;
            default:
              return null;
          }
        })}
      </main>

      <footer className="py-12 border-t border-border bg-accent/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 {settings?.site_name || "ZenStory"} Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Section Components ---

async function HeroSection({ settings, section }: { settings: any, section: any }) {
  const heroTitle = section.title || settings?.hero_title || "Nơi Những Câu Chuyện Tìm Thấy Nhà";
  const heroSubtitle = section.subtitle || settings?.hero_subtitle || "ZenStory là nền tảng xuất bản truyện chữ cao cấp dành cho tác giả độc lập.";
  const heroImage = section.imageUrl || settings?.hero_image_url;

  return (
    <section className="relative py-24 sm:py-40 overflow-hidden">
      {heroImage ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="Banner"
            fill
            priority
            unoptimized
            className="object-cover opacity-10 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
        </div>
      ) : (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-primary/10 animate-in fade-in slide-in-from-bottom-2">
          <Zap className="w-3.5 h-3.5 fill-primary" />
          {settings?.site_description?.toUpperCase() || "PHIÊN BẢN ELITE 2026 ĐÃ SẴN SÀNG"}
        </div>
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-10 max-w-5xl mx-auto leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {heroTitle}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-14 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Link href="/truyen">
            <Button size="lg" className="h-16 px-10 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              Khám phá thư viện
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="h-16 px-10 rounded-[2rem] text-sm font-black uppercase tracking-widest border-2 hover:bg-muted transition-all">
              Đăng ký tài khoản
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function LatestSection({ section, supabase }: { section: any, supabase: any }) {
  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles:author_id (display_name, avatar_url),
      chapters:chapters(count),
      ratings:ratings(rating)
    `)
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .limit(section.limit || 6)
    .order("created_at", { ascending: false });

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-16 px-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-1 bg-primary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Danh sách</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter">{section.title || "Mới Cập Nhật"}</h2>
          </div>
          <Link href="/truyen">
            <Button variant="ghost" className="group rounded-xl font-bold h-12 px-6 hover:bg-background">
              Xem tất cả
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform text-primary" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {stories?.map((story: any) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function PopularSection({ section, supabase, title, isTrending }: { section: any, supabase: any, title: string, isTrending?: boolean }) {
  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles:author_id (display_name, avatar_url),
      chapters:chapters(count),
      ratings:ratings(rating)
    `)
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
    .limit(section.limit || 6)
    .order(isTrending ? "updated_at" : "views_count_total", { ascending: false });

  return (
    <section className={isTrending ? "py-24 bg-muted/20" : "py-24 bg-background"}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-16 px-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-1 ${isTrending ? "bg-primary" : "bg-amber-500"} rounded-full`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isTrending ? "text-primary" : "text-amber-500"}`}>
                {isTrending ? "Xu hướng" : "Phổ biến"}
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter">{title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {stories?.map((story: any) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomSection({ section }: { section: any }) {
  if (!section.content) return null;

  return (
    <section className="py-24 border-y border-border/10">
      <div className="container mx-auto px-4">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:font-medium prose-p:text-muted-foreground/80">
          {renderTiptapContent(section.content)}
        </div>
      </div>
    </section>
  );
}

function GenresSection({ settings, section }: { settings: any, section: any }) {
  const genres = settings?.site_genres || [];

  return (
    <section className="py-24 bg-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <Tag className="w-3 h-3" />
            Khám phá theo chủ đề
          </div>
          <h2 className="text-4xl font-black tracking-tighter">{section.title || "Thể Loại Truyện"}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {genres.map((genre: string) => (
            <Link
              key={genre}
              href={`/truyen?genre=${encodeURIComponent(genre)}`}
              className="flex items-center justify-center p-6 bg-background border border-border/50 rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <span className="font-bold text-sm text-muted-foreground group-hover:text-primary transition-colors">{genre}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

async function StatsSection() {
  return (
    <section className="py-20 border-y border-border/50 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Tác phẩm", value: "1.2K+", icon: BookOpen },
            { label: "Độc giả", value: "50K+", icon: Star },
            { label: "Bình luận", value: "100K+", icon: Zap },
            { label: "Bảo mật", value: "99.9%", icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2 group">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryCard({ story }: { story: any }) {
  const chapterCount = story.chapters?.[0]?.count || 0;
  const views = story.views_count_total || 0;
  const formattedViews = views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views;

  // Calculate average rating
  const ratings = story.ratings || [];
  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  return (
    <Link href={`/truyen/${story.slug}`} className="group relative bg-background rounded-[3rem] overflow-hidden border border-border/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 hover:-translate-y-3 flex flex-col h-full">
      {/* Top Image Section */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {story.cover_url ? (
          <Image
            src={story.cover_url}
            alt={story.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, var(--primary) 0%, #000 150%)`,
              opacity: 0.8
            }}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-black/40" />

            {/* Artistic Initial */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[12rem] font-black text-white/5 italic select-none leading-none -mb-8">
                {story.title[0]}
              </span>
              <div className="w-16 h-1 bg-primary/30 rounded-full blur-sm" />
            </div>

            <BookOpen className="w-16 h-16 text-white/10 absolute bottom-12 right-12 -rotate-12" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-xl backdrop-blur-md",
              story.status === 'completed'
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-white text-zinc-900 border-white"
            )}>
              {story.status === 'completed' ? 'Hoàn tất' : 'Đang ra'}
            </span>
            {story.is_protected && (
              <span className="w-fit px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-400 text-amber-950 border border-amber-300 shadow-lg shadow-amber-500/20">
                Elite Protected
              </span>
            )}
          </div>
          <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {averageRating}
          </div>
        </div>

        {/* Bottom Shadow for Image */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      {/* Content Section */}
      <div className="p-8 pt-4 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {story.genres?.slice(0, 2).map((g: string) => (
              <span key={g} className="text-[8px] font-black px-2 py-0.5 bg-primary/5 text-primary rounded uppercase tracking-widest border border-primary/10">{g}</span>
            ))}
          </div>
          <h3 className="text-xl font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 min-h-[3rem]">
            {story.title}
          </h3>
        </div>

        <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed font-medium italic mb-6">
          {story.description || "Tác phẩm đang được cập nhật thông tin chi tiết từ tác giả."}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-auto pb-6">
          <div className="flex flex-col">
            <span className="text-xs font-black text-foreground leading-none mb-1">{chapterCount}</span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Chương</span>
          </div>
          <div className="w-px h-6 bg-border/50" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-foreground leading-none mb-1">{formattedViews}</span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Lượt xem</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted overflow-hidden border border-border group-hover:border-primary/50 transition-colors relative">
              {story.profiles?.avatar_url ? (
                <Image
                  src={story.profiles.avatar_url}
                  alt="Author"
                  fill
                  unoptimized
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-[10px] font-black">
                  {story.profiles?.display_name?.[0] || "U"}
                </div>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight text-foreground/60 group-hover:text-primary transition-colors line-clamp-1 max-w-[100px]">
              {story.profiles?.display_name || "ZenAuthor"}
            </span>
          </div>

          <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

async function ZenBoard({ section }: { section: any }) {
  const news = await getNews(5);
  const categories = ["Tất cả", "Thông báo", "Cập nhật", "Sự kiện"];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-muted/30 rounded-[3rem] p-8 border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Megaphone className="w-40 h-40 -rotate-12" />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            {/* Left side: Heading */}
            <div className="lg:w-1/3 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-1 bg-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Bảng tin</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 italic">{section.title || "ZenBoard"}<span className="text-primary">.</span></h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs">
                  Cập nhật những thông tin mới nhất về kỹ thuật, sự kiện và các thay đổi từ hệ thống ZenStory.
                </p>
              </div>
              <Link href="/news">
                <Button className="rounded-2xl font-bold h-12 px-8 shadow-xl shadow-primary/20">
                  Xem tất cả tin
                </Button>
              </Link>
            </div>

            {/* Right side: News Feed with Tabs */}
            <div className="lg:w-2/3">
              <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className="whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border/50 hover:border-primary hover:text-primary transition-all bg-background"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {news.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-[2rem]">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Chưa có tin tức nào mới.</p>
                  </div>
                ) : (
                  news.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-6 p-5 bg-background rounded-3xl border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group/item">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/item:scale-110 transition-transform">
                        {item.category === 'Cập nhật' ? <Zap className="w-5 h-5" /> : 
                         item.category === 'Sự kiện' ? <Sparkles className="w-5 h-5" /> : 
                         <Megaphone className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            item.category === 'Cập nhật' ? "bg-blue-500/10 text-blue-500" :
                            item.category === 'Sự kiện' ? "bg-amber-500/10 text-amber-500" :
                            "bg-primary/10 text-primary"
                          )}>
                            {item.category}
                          </span>
                          {item.is_pinned && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
                          <span className="text-[10px] font-bold text-muted-foreground/60">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        <h3 className="text-sm font-black tracking-tight truncate group-hover/item:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
