"use client";

import { useState, useEffect } from "react";
import { Search, Filter, BookOpen, User, Star, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { searchStories } from "@/actions/stories";
import { useDebounce } from "@/hooks/use-debounce";

export default function DiscoveryPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [filteredStories, setFilteredStories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicGenres, setDynamicGenres] = useState<string[]>(["Tất cả"]);

  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const fetchStories = async () => {
    setIsLoading(true);
    const data = await searchStories(debouncedSearch, selectedGenre);
    setStories(data);
    setFilteredStories(data);

    if (dynamicGenres.length <= 1) {
      // Chỉ tổng hợp thể loại một lần duy nhất lúc đầu hoặc khi có dữ liệu mới
      const genresSet = new Set<string>();
      genresSet.add("Tất cả");
      data.forEach(story => {
        if (story.genres && Array.isArray(story.genres)) {
          story.genres.forEach((g: string) => genresSet.add(g));
        }
      });
      setDynamicGenres(Array.from(genresSet));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [debouncedSearch, selectedGenre]);

  // Xóa bỏ client-side filter useEffect vì đã chuyển sang server-side

  return (
    <div className="min-h-screen bg-background flex flex-col">
       {/* Simple Navbar */}
       <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/70 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xs shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
              ZS
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">ZenStory</span>
          </Link>
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Tìm tên truyện, tác giả..." 
                className="pl-12 h-12 rounded-2xl bg-muted/50 border-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="rounded-xl border-primary/20 hover:border-primary/50 text-primary font-bold shadow-sm">Viết truyện</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0 space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 flex items-center gap-3">
                <div className="w-1 h-4 bg-primary/20 rounded-full" />
                Thể loại
              </h3>
              <div className="flex flex-wrap md:flex-col gap-2">
                {dynamicGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left border ${
                      selectedGenre === genre 
                        ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                        : "bg-muted/30 text-muted-foreground/60 border-transparent hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-1000" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Đăng ký tác giả</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed mb-6 font-medium italic">Bắt đầu hành trình sáng tác và xây dựng cộng đồng của riêng bạn ngay hôm nay.</p>
              <Link href="/register">
                <Button className="w-full rounded-2xl text-[10px] font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Tham gia ngay</Button>
              </Link>
            </div> */}
          </aside>

          {/* Stories Grid */}
          <div className="flex-1 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tighter mb-1">
                  {selectedGenre === "Tất cả" ? "Tất cả truyện" : `Thể loại: ${selectedGenre}`}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Tìm thấy {filteredStories.length} tác phẩm</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50">
                <div className="relative">
                   <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                   <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Đang lục tìm trong kho lưu trữ...</p>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50">
                <div className="w-24 h-24 bg-muted/30 rounded-[3rem] flex items-center justify-center mb-8">
                  <BookOpen className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-xl font-black text-foreground/60 tracking-tight">Không tìm thấy kết quả</h3>
                <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto mt-3 font-medium leading-relaxed italic">Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy những câu chuyện thú vị khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStories.map((story) => (
                  <Link key={story.id} href={`/truyen/${story.slug}`} className="group">
                    <div className="bg-background rounded-[3rem] overflow-hidden border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 hover:-translate-y-3 flex flex-col h-full relative">
                      {/* Cover Area */}
                      <div className="aspect-[3/4.2] relative overflow-hidden bg-muted">
                        {story.cover_url ? (
                          <Image 
                            src={story.cover_url} 
                            alt={story.title} 
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                            <BookOpen className="w-16 h-16 text-primary/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-6 left-6 z-20">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md",
                            story.status === 'completed' 
                              ? "bg-green-500/10 text-green-500 border-green-500/20" 
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {story.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}
                          </span>
                        </div>

                        <div className="absolute bottom-8 left-8 right-8 z-20">
                           <div className="flex flex-wrap gap-2 mb-4">
                            {story.genres?.slice(0, 2).map((g: string) => (
                              <span key={g} className="text-[8px] font-black px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-lg uppercase tracking-widest border border-white/10">{g}</span>
                            ))}
                          </div>
                          <h3 className="text-2xl font-black text-foreground leading-[1.1] tracking-tighter line-clamp-2 group-hover:text-primary transition-colors duration-500">{story.title}</h3>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="px-8 pb-8 flex-1 flex flex-col justify-between">
                        <div className="pt-2">
                           <p className="text-[11px] text-muted-foreground/70 line-clamp-2 mb-6 leading-relaxed font-medium italic">
                            {story.description || "Chưa có mô tả cho tác phẩm này."}
                          </p>
                          
                          <div className="flex items-center gap-6 mb-8">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{story.chapter_count}</span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Chương</span>
                            </div>
                            <div className="w-px h-6 bg-border/50" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none mb-1">Elite</span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Rank</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-muted overflow-hidden border border-border shadow-sm relative">
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
                                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30 font-black text-[10px]">
                                  {story.profiles?.display_name?.[0] || "U"}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tight text-foreground/60">{story.profiles?.display_name || "Tác giả"}</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg shadow-primary/5">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border bg-accent/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 ZenStory Platform. Khám phá kho tàng tri thức và cảm xúc.</p>
        </div>
      </footer>
    </div>
  );
}
