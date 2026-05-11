import { getRankings } from "@/actions/stories";
import { getSiteSettings } from "@/actions/settings";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Flame, BookOpen, Star, TrendingUp, User, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function RankingPage({ searchParams }: { searchParams: { type?: string } }) {
  const { type = "views" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const [stories, settings] = await Promise.all([
    getRankings(type as any, 20),
    getSiteSettings()
  ]);

  const tabs = [
    { id: "views", label: "Lượt xem", icon: Flame },
    { id: "chapters", label: "Số chương", icon: BookOpen },
    { id: "new", label: "Truyện mới", icon: Star },
  ];

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="min-h-screen bg-background pb-24" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />

      <main className="container mx-auto px-4 pt-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-primary/20">
            <Trophy className="w-3 h-3 fill-current" />
            Hall of Fame
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Bảng Xếp Hạng
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
            Vinh danh những siêu phẩm đang "làm mưa làm gió" trên {settings?.site_name || "ZenStory"}.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = type === tab.id;
            return (
              <Link 
                key={tab.id}
                href={`/ranking?type=${tab.id}`}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "animate-pulse" : "")} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Top 3 Podium */}
        {stories.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end max-w-5xl mx-auto">
            {/* Rank 2 */}
            <div className="order-2 md:order-1 flex flex-col items-center gap-4">
              <Link href={`/truyen/${stories[1].slug}`} className="relative group">
                <div className="w-40 h-52 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-zinc-300">
                  <OptimizedImage alt={stories[1].title} src={stories[1].cover_url} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-zinc-300 rounded-xl flex items-center justify-center font-black text-zinc-800 shadow-lg">2</div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-zinc-300 rounded-2xl flex items-center justify-center text-zinc-800 border-4 border-background shadow-xl">
                   <TrendingUp className="w-6 h-6" />
                </div>
              </Link>
              <div className="text-center">
                <h3 className="font-black text-xl tracking-tight line-clamp-1">{stories[1].title}</h3>
                <p className="text-xs font-bold text-muted-foreground">🥈 Silver Medalist</p>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="order-1 md:order-2 flex flex-col items-center gap-6">
              <Link href={`/truyen/${stories[0].slug}`} className="relative group">
                <div className="w-48 h-64 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] border-4 border-amber-400 scale-110">
                  <OptimizedImage alt={stories[0].title} src={stories[0].cover_url} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center font-black text-amber-900 shadow-lg">1</div>
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                   <Crown className="w-12 h-12 text-amber-400 fill-amber-400 animate-bounce" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-400 rounded-3xl flex items-center justify-center text-amber-900 border-4 border-background shadow-2xl">
                   <Flame className="w-8 h-8 fill-current" />
                </div>
              </Link>
              <div className="text-center pt-4">
                <h3 className="font-black text-3xl tracking-tighter line-clamp-1 text-primary uppercase">{stories[0].title}</h3>
                <p className="text-sm font-black text-amber-500 uppercase tracking-widest">🏆 The Ultimate Champion</p>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="order-3 flex flex-col items-center gap-4">
              <Link href={`/truyen/${stories[2].slug}`} className="relative group">
                <div className="w-40 h-52 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-amber-700/50">
                  <OptimizedImage alt={stories[2].title} src={stories[2].cover_url} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-amber-700 text-white rounded-xl flex items-center justify-center font-black shadow-lg">3</div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-700 rounded-2xl flex items-center justify-center text-white border-4 border-background shadow-xl">
                   <Star className="w-6 h-6 fill-current" />
                </div>
              </Link>
              <div className="text-center">
                <h3 className="font-black text-xl tracking-tight line-clamp-1">{stories[2].title}</h3>
                <p className="text-xs font-bold text-muted-foreground">🥉 Bronze Medalist</p>
              </div>
            </div>
          </div>
        )}

        {/* List of Other Ranks */}
        <div className="max-w-5xl mx-auto space-y-4">
          {stories.slice(stories.length >= 3 ? 3 : 0).map((story: any, index: any) => {
            const actualRank = (stories.length >= 3 ? 3 : 0) + index + 1;
            return (
              <Link 
                key={story.id}
                href={`/truyen/${story.slug}`}
                className="group flex items-center gap-6 p-4 bg-muted/20 hover:bg-muted/40 border border-border/50 rounded-3xl transition-all hover:scale-[1.01]"
              >
                <div className="w-12 h-12 flex items-center justify-center font-black text-2xl text-muted-foreground group-hover:text-primary transition-colors">
                  {actualRank}
                </div>
                
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm">
                  <OptimizedImage alt={story.title} src={story.cover_url} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                     {story.title}
                   </h4>
                   <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 opacity-60" />
                        {story.profiles?.display_name || "Vô danh"}
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {story.views_count_total?.toLocaleString() || 0} lượt xem
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        {story.chapter_count || 0} chương
                      </div>
                   </div>
                </div>

                <div className="pr-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
