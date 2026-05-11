"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle2, Loader2, WifiOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveChapterOffline, removeOfflineStory, isStoryOffline } from "@/lib/offline-storage";
import { getChaptersContentByStory } from "@/actions/chapters";

interface DownloadStoryButtonProps {
  storyId: string;
  storyTitle: string;
  storySlug: string;
  coverUrl?: string; // Thêm coverUrl vào đây
  allowOffline: boolean;
}

export function DownloadStoryButton({ storyId, storyTitle, storySlug, coverUrl, allowOffline }: DownloadStoryButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'downloading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    checkOfflineStatus();
  }, [storyId]);

  const checkOfflineStatus = async () => {
    // Check locally in IndexedDB if any chapter of this story exists
    const offline = await isStoryOffline(storyId);
    setIsDownloaded(offline);
  };

  const handleDownload = async () => {
    if (!allowOffline) {
      toast.error("Tác giả không cho phép tải truyện này.");
      return;
    }

    setStatus('downloading');
    setProgress(0);

    try {
      const chapters = await getChaptersContentByStory(storyId);
      if (chapters.length === 0) {
        toast.error("Không có chương nào để tải.");
        setStatus('idle');
        return;
      }

      let count = 0;
      const CACHE_NAME = 'zenstory-v2';

      for (const chapter of chapters) {
        // 1. Lưu nội dung vào IndexedDB (đã mã hóa)
        const contentStr = JSON.stringify(chapter.content_json);
        await saveChapterOffline(storyId, chapter.id, contentStr, {
          title: chapter.title,
          slug: chapter.slug,
          order_index: chapter.order_index,
          storyTitle: storyTitle,
          storySlug: storySlug,
          coverUrl: coverUrl
        });

        // 2. Lưu bộ khung HTML vào Cache của Service Worker để có thể mở trang khi offline
        if ('caches' in window) {
          try {
            const cache = await window.caches.open(CACHE_NAME);
            const chapterUrl = `/truyen/${storySlug}/${chapter.slug}`;
            await cache.add(chapterUrl);
          } catch (e) {
            console.warn("Could not cache shell for:", chapter.slug);
          }
        }
        
        count++;
        setProgress(Math.round((count / chapters.length) * 100));
      }

      setIsDownloaded(true);
      setStatus('completed');
      toast.success(`Đã tải xuống thành công ${chapters.length} chương!`);
      
      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Lỗi khi tải truyện.");
      setStatus('idle');
    }
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc muốn xóa bản offline của truyện này?")) {
      await removeOfflineStory(storyId);
      setIsDownloaded(false);
      toast.info("Đã xóa bản offline.");
    }
  };

  if (!allowOffline && !isDownloaded) return null;

  return (
    <div className="flex items-center gap-2">
      {status === 'downloading' ? (
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Đang tải... {progress}%</span>
          </div>
        </div>
      ) : isDownloaded ? (
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                className="h-14 rounded-2xl font-black uppercase tracking-widest border-green-500/30 bg-green-500/5 text-green-600 gap-2 cursor-default hover:bg-green-500/5"
            >
                <CheckCircle2 className="w-5 h-5" /> Đã tải Offline
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="w-14 h-14 rounded-2xl text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                title="Xóa bản offline"
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>
      ) : (
        <Button 
          onClick={handleDownload}
          variant="outline"
          className="h-14 rounded-2xl font-black uppercase tracking-widest border-primary/30 hover:bg-primary/5 gap-2"
        >
          <WifiOff className="w-5 h-5" /> Tải đọc Offline
        </Button>
      )}
    </div>
  );
}
