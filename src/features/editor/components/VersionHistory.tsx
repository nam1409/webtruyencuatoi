"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RotateCcw, Clock, User, ChevronRight, Loader2 } from "lucide-react";
import { getChapterVersions, rollbackChapterVersion } from "@/actions/chapters";
import { toast } from "sonner";

interface VersionHistoryProps {
  chapterId: string;
  onRollback: (content: any) => void;
}

export function VersionHistory({ chapterId, onRollback }: VersionHistoryProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersions() {
      try {
        const data = await getChapterVersions(chapterId);
        setVersions(data);
      } catch (error) {
        toast.error("Không thể tải lịch sử phiên bản");
      } finally {
        setIsLoading(false);
      }
    }
    loadVersions();
  }, [chapterId]);

  const handleRollback = async (versionId: string) => {
    setIsRollingBack(versionId);
    try {
      const updatedChapter = await rollbackChapterVersion(chapterId, versionId);
      onRollback(updatedChapter.content_json);
      toast.success("Đã khôi phục phiên bản thành công");
    } catch (error) {
      toast.error("Lỗi khi khôi phục phiên bản");
    } finally {
      setIsRollingBack(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2 px-1">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground/40">Lịch sử bản thảo</h3>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-10 px-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
          <p className="text-[10px] text-muted-foreground/60 italic">Chưa có bản lưu nào.</p>
        </div>
      ) : (
        <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {versions.map((v) => (
            <div 
              key={v.id}
              className="relative group animate-in fade-in slide-in-from-left-2 duration-300"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full border-2 border-background bg-border group-hover:bg-primary transition-colors" />
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-foreground/80">
                      {format(new Date(v.created_at), "HH:mm, dd/MM", { locale: vi })}
                    </span>
                    <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">
                      {v.profiles?.display_name || "Tác giả"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRollback(v.id)}
                    disabled={!!isRollingBack}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary rounded-lg transition-all"
                    title="Khôi phục"
                  >
                    {isRollingBack === v.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                
                {v.note && (
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed line-clamp-1 border-l-2 border-primary/20 pl-2">
                    {v.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-muted-foreground/40 text-center px-4 mt-4 leading-relaxed">
        Hệ thống tự động lưu các mốc thời gian quan trọng để bảo vệ công sức của bạn.
      </p>
    </div>
  );
}
