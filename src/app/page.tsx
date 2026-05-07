import { BookOpen, PenTool, Zap, Shield, ChevronRight, Star, BarChart3, Trophy, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/actions/settings";
import { renderTiptapContent } from "@/lib/renderer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    { type: 'latest', id: 'l1', enabled: true, title: 'Mới Cập Nhật', limit: 12 },
    { type: 'popular', id: 'p1', enabled: true, title: 'Truyện Hot', limit: 6 }
  ];

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="flex flex-col min-h-screen bg-background" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />

      <main className="flex-1">
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
          <img src={heroImage} alt="Banner" className="w-full h-full object-cover opacity-10 blur-sm" />
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
              Bắt đầu sáng tác
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
      profiles:author_id (display_name, avatar_url)
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
      profiles:author_id (display_name, avatar_url)
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
  return (
    <Link href={`/truyen/${story.slug}`} className="group relative bg-background rounded-[2.5rem] overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 flex flex-col h-full">
      <div className="aspect-[4/5] bg-muted relative overflow-hidden">
        {story.cover_url ? (
          <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center text-4xl font-serif italic text-primary/20">
            {story.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-90 transition-opacity" />
        
        <div className="absolute bottom-8 left-8 right-8 z-20">
          <div className="flex gap-2 mb-4">
            {story.genres?.slice(0, 1).map((g: string) => (
              <span key={g} className="text-[9px] font-black px-3 py-1 bg-primary text-primary-foreground rounded-lg uppercase tracking-widest">{g}</span>
            ))}
          </div>
          <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">{story.title}</h3>
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col justify-between">
        <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-8 leading-relaxed font-medium">
          {story.description || "Tác phẩm này đang trong quá trình cập nhật thông tin chi tiết từ tác giả."}
        </p>
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border/50">
               <img src={story.profiles?.avatar_url} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Tác giả</span>
              <span className="text-xs font-bold text-foreground/80">{story.profiles?.display_name || "Ẩn danh"}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
