"use client";

import { useState, useEffect } from "react";
import { BookOpen, WifiOff, ChevronRight, Clock, Trash2 } from "lucide-react";
import { getOfflineStories, removeOfflineStory } from "@/lib/offline-storage";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { OptimizedImage } from "../ui/OptimizedImage";

export function OfflineLibrary() {
  const [stories, setStories] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine);

    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    loadOfflineStories();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const loadOfflineStories = async () => {
    const data = await getOfflineStories();
    setStories(data);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Xóa bản offline này?")) {
      await removeOfflineStory(id);
      loadOfflineStories();
      toast.success("Đã xóa khỏi bộ nhớ máy.");
    }
  };

  if (!isOffline && stories.length === 0) return null;

  return (
    <section className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <WifiOff className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase">Thư viện ngoại tuyến</h2>
            </div>
            <p className="text-sm font-medium text-muted-foreground max-w-md">
              Duyệt và đọc những tác phẩm bạn đã lưu an toàn trong máy. Luôn khả dụng ngay cả khi không có mạng.
            </p>
          </div>
          
          {isOffline && (
             <div className="px-6 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                Offline Mode Active
             </div>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border/50 rounded-[3rem] bg-muted/5">
             <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Bạn chưa tải truyện nào về máy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link 
                key={story.id} 
                href={story.slug ? `/truyen/${story.slug}` : "#"}
                className="group relative bg-background border border-border/50 rounded-[2.5rem] p-6 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                <div className="relative z-10 flex gap-6">
                  {/* Cover Image */}
                  <div className="w-24 h-32 rounded-2xl bg-muted overflow-hidden border border-border/50 flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                    {story.coverUrl ? (
                      <OptimizedImage src={story.coverUrl} className="w-full h-full object-cover" alt={story.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 italic text-[8px] uppercase font-black">No Cover</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-[8px] font-black uppercase tracking-widest">
                         {story.chapterCount} chương
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, story.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {story.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 italic uppercase tracking-widest truncate">
                         <Clock className="w-3 h-3" />
                         {formatDistanceToNow(new Date(story.lastSavedAt), { addSuffix: true, locale: vi })}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                         <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
