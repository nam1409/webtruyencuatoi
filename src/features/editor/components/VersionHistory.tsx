"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RotateCcw, Clock, Plus, ChevronRight, Loader2, Eye, History, GitBranch } from "lucide-react";
import { 
  getChapterVersions, 
  getVersionHistory, 
  createChapterVersion, 
  saveVersionSnapshot,
  restoreVersionToDraft,
  publishVersionTrack,
  updateVersionName,
  deleteVersion,
  getChapterOriginalContent,
  updateVersionStatus,
  setPrimaryVersion,
  updateChapterStatus
} from "@/actions/chapters";
import { Rocket, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PromptDialog } from "@/components/ui/prompt-dialog";

interface VersionHistoryProps {
  chapterId: string;
  onRollback: (content: any) => void;
  onCompare: (content: any) => void;
  selectedTrackId: string | null;
  onTrackChange: (id: string | null) => void;
}

const safeFormatDate = (dateStr: string | null) => {
  if (!dateStr) return "Chưa cập nhật";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  return format(date, "HH:mm, dd/MM", { locale: vi });
};

export function VersionHistory({ 
  chapterId, 
  onRollback, 
  onCompare,
  selectedTrackId,
  onTrackChange
}: VersionHistoryProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreatingTrack, setIsCreatingTrack] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [originalContent, setOriginalContent] = useState<any>(null);
  
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // 1. Tải danh sách Tracks (Bản dịch, Bản Beta...) và Bản gốc
  const loadTracks = async () => {
    try {
      const [versions, original] = await Promise.all([
        getChapterVersions(chapterId),
        getChapterOriginalContent(chapterId)
      ]);
      
      setTracks(versions);
      setOriginalContent(original);
      
      if (versions.length > 0 && !selectedTrackId) {
        onTrackChange(versions[0].id);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách phiên bản");
    } finally {
      setIsLoadingTracks(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [chapterId]);

  // 2. Tải lịch sử của Track được chọn
  useEffect(() => {
    if (!selectedTrackId) return;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const data = await getVersionHistory(selectedTrackId!);
        setHistory(data);
      } catch (error) {
        toast.error("Không thể tải lịch sử");
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, [selectedTrackId]);

  const handleCreateTrack = async (name: string) => {
    if (!name) return;
    setIsCreatingTrack(true);
    try {
      const newTrack = await createChapterVersion(chapterId, name);
      setTracks([newTrack, ...tracks]);
      onTrackChange(newTrack.id);
      toast.success(`Đã tạo phiên bản: ${name}`);
    } catch (error) {
      toast.error("Lỗi khi tạo phiên bản");
    } finally {
      setIsCreatingTrack(false);
    }
  };

  const handleUpdateTrackName = async (name: string) => {
    if (!editingTrack || !name) return;
    try {
      await updateVersionName(editingTrack.id, name);
      toast.success("Đã đổi tên phiên bản");
      loadTracks();
    } catch (error) {
      toast.error("Lỗi khi đổi tên");
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiên bản này? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteVersion(id);
      toast.success("Đã xóa phiên bản");
      if (selectedTrackId === id) onTrackChange(tracks.find(t => t.id !== id)?.id || null);
      loadTracks();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa phiên bản");
    }
  };

  const handleRestore = async (content: any) => {
    try {
      await restoreVersionToDraft(chapterId, content);
      onRollback(content);
      toast.success("Đã khôi phục vào trình soạn thảo");
    } catch (error) {
      toast.error("Lỗi khi khôi phục");
    }
  };

  if (isLoadingTracks) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Track Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground/40">Các luồng nội dung</h3>
          </div>
          <button 
            onClick={() => setShowCreateDialog(true)}
            disabled={isCreatingTrack}
            className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
            title="Thêm luồng mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Bản gốc (Original Content from chapters table) */}
          {originalContent && (
            <button
              onClick={() => {
                onTrackChange("original");
                onRollback(originalContent.content_draft || originalContent.content_json);
              }}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group relative overflow-hidden",
                selectedTrackId === "original" 
                  ? "bg-primary/5 border-primary/20 ring-2 ring-primary/5 shadow-sm" 
                  : "bg-muted/5 border-border/40 hover:bg-muted/10 hover:border-border"
              )}
            >
              <div className="flex flex-col gap-1 pr-8">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    selectedTrackId === "original" ? "text-primary" : "text-foreground/70"
                  )}>
                    Bản gốc (Database)
                  </span>
                  <div className="flex items-center gap-1">
                    {tracks.every(t => !t.is_primary) && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[7px] font-black uppercase rounded-md border border-primary/20">
                        Primary
                      </span>
                    )}
                    {originalContent.status === 'published' && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase rounded-md border border-emerald-500/20">
                        Public
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[7px] font-black uppercase rounded-md border border-border">
                      Static
                    </span>
                  </div>
                </div>
                <span className="text-[8px] text-muted-foreground/60">
                  Cập nhật: {safeFormatDate(originalContent.updated_at)}
                </span>
              </div>
              <ChevronRight className={cn(
                "w-3 h-3 transition-all flex-shrink-0",
                selectedTrackId === "original" ? "text-primary" : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
              )} />
              
              {selectedTrackId === "original" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}

              {/* Quick Actions for Original */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 z-10 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newStatus = originalContent.status === 'published' ? 'draft' : 'published';
                    updateChapterStatus(chapterId, newStatus).then(() => loadTracks());
                  }}
                  className={cn(
                    "p-1.5 rounded-lg border shadow-sm transition-all bg-background",
                    originalContent.status === 'published' ? "border-emerald-500/20 text-emerald-500" : "border-border text-muted-foreground"
                  )}
                  title={originalContent.status === 'published' ? "Gỡ bài" : "Công khai bản gốc"}
                >
                  <Eye className="w-3 h-3" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimaryVersion("original", chapterId).then(() => loadTracks());
                  }}
                  className={cn(
                    "p-1.5 rounded-lg border shadow-sm transition-all bg-background",
                    tracks.every(t => !t.is_primary) ? "border-primary/20 text-primary" : "border-border text-muted-foreground"
                  )}
                  title="Đặt bản gốc làm mặc định"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </button>
          )}

          {tracks.length === 0 && !originalContent ? (
            <button 
              onClick={() => setShowCreateDialog(true)}
              className="py-6 px-4 border-2 border-dashed border-border/40 rounded-3xl text-[10px] font-bold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all bg-muted/5"
            >
              + Tạo luồng nội dung đầu tiên
            </button>
          ) : (
            tracks.map((track) => (
              <div key={track.id} className="relative group">
                <button
                  onClick={() => {
                    onTrackChange(track.id);
                    onRollback(track.content_draft || track.content_json);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left relative overflow-hidden",
                    selectedTrackId === track.id 
                      ? "bg-primary/5 border-primary/20 ring-2 ring-primary/5 shadow-sm" 
                      : "bg-muted/10 border-transparent hover:bg-muted/20 hover:border-border/20"
                  )}
                >
                  <div className="flex flex-col gap-1.5 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        selectedTrackId === track.id ? "text-primary" : "text-foreground/80"
                      )}>
                        {track.name}
                      </span>
                      {track.is_primary && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[7px] font-black uppercase rounded-md border border-primary/20">
                          Primary
                        </span>
                      )}
                      {track.status === 'published' && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase rounded-md border border-emerald-500/20">
                          Public
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {safeFormatDate(track.updated_at)}
                    </span>
                  </div>

                  <ChevronRight className={cn(
                    "w-3 h-3 transition-all flex-shrink-0",
                    selectedTrackId === track.id ? "text-primary" : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
                  )} />
                  
                  {selectedTrackId === track.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                </button>

                {/* Quick Actions Overlay on Hover */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 z-10 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTrack(track);
                      setShowEditDialog(true);
                    }}
                    className="p-1.5 rounded-lg bg-background border border-border shadow-sm text-muted-foreground hover:text-primary transition-all"
                    title="Đổi tên"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await publishVersionTrack(track.id);
                        toast.success(`Đã cập nhật bản công khai cho luồng ${track.name}`);
                        loadTracks();
                      } catch (err) {
                        toast.error("Không thể cập nhật bản công khai");
                      }
                    }}
                    className="p-1.5 rounded-lg bg-background border border-emerald-500/20 shadow-sm text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    title="Xuất bản ngay"
                  >
                    <Rocket className="w-3 h-3" />
                  </button>
                  
                  {!track.is_primary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrack(track.id);
                      }}
                      className="p-1.5 rounded-lg bg-background border border-red-500/20 shadow-sm text-red-500 hover:bg-red-500/10 transition-all"
                      title="Xóa luồng"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  <div className="w-px h-4 bg-border/40 mx-0.5" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus = track.status === 'published' ? 'draft' : 'published';
                      updateVersionStatus(track.id, newStatus).then(() => loadTracks());
                    }}
                    className={cn(
                      "p-1.5 rounded-lg border shadow-sm transition-all bg-background",
                      track.status === 'published' ? "border-emerald-500/20 text-emerald-500" : "border-border text-muted-foreground"
                    )}
                    title={track.status === 'published' ? "Gỡ bài" : "Công khai bản này"}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimaryVersion(track.id, chapterId).then(() => loadTracks());
                    }}
                    className={cn(
                      "p-1.5 rounded-lg border shadow-sm transition-all bg-background",
                      track.is_primary ? "border-primary/20 text-primary" : "border-border text-muted-foreground"
                    )}
                    title="Đặt làm mặc định"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History of selected track */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground/40">Lịch sử của luồng</h3>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-primary/30" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 px-4 bg-muted/5 rounded-2xl border border-dashed border-border/50">
            <p className="text-[10px] text-muted-foreground/60 italic">Chưa có điểm khôi phục nào.</p>
          </div>
        ) : (
          <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
            {history.map((h, index) => {
              const selectedTrack = tracks.find(t => t.id === selectedTrackId);
              const isTrackPublished = selectedTrack?.status === 'published';
              const isCurrent = index === 0;

              return (
                <div key={h.id} className="relative group">
                  <div className={cn(
                    "absolute -left-[20px] top-1.5 w-2 h-2 rounded-full border-2 border-background transition-colors",
                    isCurrent ? "bg-primary scale-125" : "bg-border group-hover:bg-primary"
                  )} />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-foreground/80">
                            {safeFormatDate(h.created_at)}
                          </span>
                          {isCurrent && (
                            <span className="text-[7px] font-black uppercase px-1 bg-primary/10 text-primary rounded border border-primary/20">
                              Hiện tại
                            </span>
                          )}
                          {isTrackPublished && (
                            <span className="text-[7px] font-black uppercase px-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
                              Public
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">
                          {h.profiles?.display_name || "Thành viên"}
                        </span>
                      </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onCompare(h.content_json)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary rounded-lg transition-all"
                        title="So sánh"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRestore(h.content_json)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary rounded-lg transition-all"
                        title="Khôi phục vào nháp"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {h.note && (
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed line-clamp-1 border-l-2 border-primary/20 pl-2">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      <p className="text-[9px] text-muted-foreground/40 text-center px-4 mt-6 leading-relaxed">
        {selectedTrackId === "original" 
          ? "Bản gốc không hỗ trợ lưu điểm khôi phục. Hãy tạo luồng mới (+) để quản lý lịch sử."
          : "Chọn một luồng nội dung bên trên để xem lịch sử chỉnh sửa chi tiết của luồng đó."}
      </p>

      <PromptDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Tạo luồng nội dung mới"
        description="Đặt tên cho bản thảo mới của bạn (ví dụ: Bản dịch, Bản Edit, Bản Beta...)"
        placeholder="Nhập tên phiên bản..."
        onConfirm={handleCreateTrack}
      />

      <PromptDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Đổi tên phiên bản"
        description="Nhập tên mới cho luồng nội dung này."
        defaultValue={editingTrack?.name}
        placeholder="Tên phiên bản mới..."
        onConfirm={handleUpdateTrackName}
      />
    </div>
  );
}
