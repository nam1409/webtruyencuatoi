"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, Filter, BookOpen, Star, ChevronRight, Loader2, 
  Tag, Shield, Clock, Activity, X, SlidersHorizontal, BarChart3 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { searchStories } from "@/actions/stories";
import { useDebounce } from "@/hooks/use-debounce";
import { getSiteSettings } from "@/actions/settings";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// --- Interfaces ---
interface Story {
  id: string;
  slug: string;
  title: string;
  cover_url?: string;
  status: string;
  genres: string[];
  is_protected: boolean;
  views_count_total: number;
  description?: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
  chapters?: [{ count: number }];
  ratings?: [{ rating: number }];
  updated_at?: string;
}

// --- Components ---

function FilterChip({ 
  label, 
  active, 
  onClick, 
  variant = "primary" 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
  variant?: "primary" | "emerald" | "amber" | "blue" 
}) {
  const variants = {
    primary: active ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" : "bg-muted/30 text-muted-foreground/60 border-transparent hover:bg-muted/50",
    emerald: active ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-muted/30 text-muted-foreground/60 border-transparent hover:bg-muted/50",
    amber: active ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/10" : "bg-muted/30 text-muted-foreground/60 border-transparent hover:bg-muted/50",
    blue: active ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/10" : "bg-muted/30 text-muted-foreground/60 border-transparent hover:bg-muted/50",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border outline-none",
        variants[variant]
      )}
    >
      {label}
    </button>
  );
}

function StoryCard({ story }: { story: Story }) {
  const chapterCount = story.chapters?.[0]?.count || 0;
  const views = story.views_count_total || 0;
  const formattedViews = Intl.NumberFormat("vi-VN", { notation: 'compact' }).format(views);
  const ratings = story.ratings || [];
  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  const updatedTime = story.updated_at 
    ? formatDistanceToNow(new Date(story.updated_at), { addSuffix: true, locale: vi })
    : null;

  return (
    <Link href={`/truyen/${story.slug}`} className="group block h-full">
      <div className="flex flex-col h-full overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30">
        <div className="relative aspect-[3/4.2] overflow-hidden">
          {story.cover_url ? (
            <Image src={story.cover_url} alt={story.title} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/20">
              <BookOpen className="h-10 w-10 text-muted-foreground/10" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
            {story.is_protected && (
              <div className="p-1.5 rounded-lg bg-amber-400 text-amber-950 shadow-lg border border-amber-300/50">
                <Shield className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
            {story.status === "completed" && (
              <div className="rounded-md bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-white shadow-lg border border-white/10">Full</div>
            )}
          </div>
          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold flex items-center gap-1 shadow-xl">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {averageRating}
          </div>
        </div>
        <div className="flex flex-col flex-1 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary/60 uppercase tracking-widest opacity-70">
              <span className="truncate max-w-[80px]">{story.genres?.[0] || "Novel"}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{chapterCount} ch</span>
            </div>
            {updatedTime && (
              <span className="text-[8px] font-medium text-muted-foreground/40 italic shrink-0">
                {updatedTime}
              </span>
            )}
          </div>
          <h3 className="line-clamp-1 text-base font-bold leading-tight transition-colors group-hover:text-primary">{story.title}</h3>
          
          {story.description && (
            <p className="line-clamp-2 text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
              {story.description.replace(/<[^>]*>/g, '')}
            </p>
          )}

          <div className="mt-auto pt-3 border-t border-border/5 flex items-center justify-between text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tight">
            <span className="truncate pr-2">{story.profiles?.display_name || "Ẩn danh"}</span>
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

// --- Main Discovery Page (Inner with Suspense) ---

function DiscoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL-driven state
  const q = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "Tất cả";
  const status = searchParams.get("status") || "Tất cả";
  const minCh = searchParams.get("min") || "";
  const maxCh = searchParams.get("max") || "";
  const sort = searchParams.get("sort") || "Mới nhất";

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableGenres, setAvailableGenres] = useState<string[]>(["Tất cả"]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [searchInputValue, setSearchInputValue] = useState(q);
  const debouncedSearch = useDebounce(searchInputValue, 500);

  // Sync Search Input with Debounce
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    router.push(`/truyen?${params.toString()}`, { scroll: false });
  }, [debouncedSearch]);

  // Fetch Genres once
  useEffect(() => {
    getSiteSettings().then(settings => {
      if (settings?.site_genres) {
        setAvailableGenres(["Tất cả", ...settings.site_genres]);
      }
    });
  }, []);

  // Update URL function
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "Tất cả" || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`/truyen?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Main Fetch Logic with Race Condition Handling
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchFilteredStories = async () => {
      try {
        setIsLoading(true);
        const data = await searchStories({
          query: q,
          genre: genre,
          status: status,
          minChapters: minCh === "" ? undefined : Number(minCh),
          maxChapters: maxCh === "" ? undefined : Number(maxCh),
          sortBy: sort
        });
        
        if (!controller.signal.aborted) {
          setStories(data as Story[] || []);
        }
      } catch (error) {
        if (!controller.signal.aborted) console.error("Fetch error:", error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchFilteredStories();
    return () => controller.abort();
  }, [q, genre, status, minCh, maxCh, sort]);

  const clearAllFilters = () => {
    setSearchInputValue("");
    router.push("/truyen", { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
       {/* Discovery Header */}
       <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-[8px] shadow-lg shadow-primary/20">ZS</div>
            <span className="hidden md:block">ZenStory</span>
          </Link>
          
          <div className="flex-1 max-w-2xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm tên truyện, tác giả..." 
              className="pl-12 h-11 rounded-2xl bg-muted/40 border-border/40 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all text-sm"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            className="lg:hidden rounded-xl border-2" 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className={cn(
            "lg:w-72 shrink-0 space-y-10 lg:block transition-all duration-300",
            showMobileFilters ? "block" : "hidden"
          )}>
            {/* Genre */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <div className="w-4 h-px bg-current" /> Thể loại
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map(g => (
                  <FilterChip key={g} label={g} active={genre === g} onClick={() => updateFilter("genre", g)} />
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 flex items-center gap-2">
                <div className="w-4 h-px bg-current" /> Trạng thái
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Tất cả", "Đang ra", "Hoàn thành"].map(s => (
                  <FilterChip key={s} label={s} active={status === s} variant="emerald" onClick={() => updateFilter("status", s)} />
                ))}
              </div>
            </div>

            {/* Chapters */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2">
                <div className="w-4 h-px bg-current" /> Quy mô
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Từ" className="h-9 rounded-xl bg-muted/30 border-transparent text-xs" value={minCh} onChange={e => updateFilter("min", e.target.value)} />
                <Input type="number" placeholder="Đến" className="h-9 rounded-xl bg-muted/30 border-transparent text-xs" value={maxCh} onChange={e => updateFilter("max", e.target.value)} />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
                <div className="w-4 h-px bg-current" /> Sắp xếp
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {["Mới nhất", "Lượt xem", "Chương nhiều"].map(s => (
                  <FilterChip key={s} label={s} active={sort === s} variant="blue" onClick={() => updateFilter("sort", s)} />
                ))}
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">{genre === "Tất cả" ? "Tất cả tác phẩm" : genre}</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                  <Activity className="w-3 h-3 text-primary animate-pulse" />
                  Kết quả: {stories.length} câu chuyện
                </div>
              </div>

              {(q || genre !== "Tất cả" || status !== "Tất cả" || minCh || maxCh) && (
                <Button variant="ghost" onClick={clearAllFilters} className="text-[10px] font-bold uppercase text-destructive hover:bg-destructive/5">
                  <X className="w-3.5 h-3.5 mr-2" /> Xóa lọc
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4 bg-muted/5 rounded-[2.5rem] border border-dashed">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Đang truy vấn tinh hoa...</p>
              </div>
            ) : stories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center bg-muted/5 rounded-[3rem] border border-dashed">
                <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-6" />
                <h3 className="text-xl font-bold text-muted-foreground/40">Không tìm thấy kết quả phù hợp</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 animate-in fade-in duration-500">
                {stories.map(story => <StoryCard key={story.id} story={story} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <DiscoveryContent />
    </Suspense>
  );
}