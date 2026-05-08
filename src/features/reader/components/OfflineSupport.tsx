"use client";

import { useState, useEffect } from "react";
import { WifiOff, ShieldCheck, Loader2 } from "lucide-react";
import { getOfflineChapter } from "@/lib/offline-storage";
import { StaticContent } from "./StaticContent";

interface OfflineSupportProps {
  storyId: string;
  chapterId: string;
  initialContent: any;
  settings: any;
  commentCounts: any;
}

export function OfflineSupport({ 
  storyId, 
  chapterId, 
  initialContent, 
  settings, 
  commentCounts 
}: OfflineSupportProps) {
  const [content, setContent] = useState(initialContent);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If we have no content from server, try to find offline
    if (!initialContent) {
      loadOfflineContent();
    }
  }, [initialContent, chapterId]);

  const loadOfflineContent = async () => {
    setIsLoading(true);
    try {
      const decrypted = await getOfflineChapter(storyId, chapterId);
      if (decrypted) {
        setContent(JSON.parse(decrypted));
        setIsOfflineMode(true);
      }
    } catch (error) {
      console.error("Offline load failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">Đang giải mật nội dung offline...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Mất kết nối</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                Nội dung này chưa được tải về máy. Vui lòng kết nối mạng để tiếp tục đọc.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isOfflineMode && (
        <div className="mb-8 flex items-center justify-center gap-2 py-3 px-6 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-green-700">
            Đang đọc bản lưu Offline (Đã giải mã)
          </span>
        </div>
      )}
      <StaticContent 
        content={content} 
        settings={settings} 
        commentCounts={commentCounts} 
      />
    </div>
  );
}
