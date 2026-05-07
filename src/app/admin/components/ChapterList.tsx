"use client";

import Link from "next/link";
import { 
  Edit3, Trash2, Clock, CheckCircle2, Circle, Layers, 
  FileText, Eye, MessageSquare, CheckSquare, Square, 
  Rocket, MoveUp, MoveDown 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { deleteChapter, reorderChapters, bulkUpdateChapters, bulkDeleteChapters } from "@/actions/chapters";
import { toast } from "sonner";
import { EditChapterDialog } from "./EditChapterDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface ChapterListProps {
  chapters: any[];
  storyId: string;
  volumes?: any[];
}

export function ChapterList({ chapters, storyId, volumes = [] }: ChapterListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (chapterIds: string[]) => {
    const newSelected = new Set(selectedIds);
    const allIn = chapterIds.every(id => newSelected.has(id));
    
    if (allIn) {
      chapterIds.forEach(id => newSelected.delete(id));
    } else {
      chapterIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkActionLoading(true);
    try {
      await bulkUpdateChapters(
        Array.from(selectedIds), 
        { status: 'published', published_at: new Date().toISOString() }, 
        storyId
      );
      toast.success(`Đã xuất bản ${selectedIds.size} chương`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Lỗi khi cập nhật hàng loạt");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} chương đã chọn?`)) {
      setIsBulkActionLoading(true);
      try {
        await bulkDeleteChapters(Array.from(selectedIds), storyId);
        toast.success(`Đã xóa ${selectedIds.size} chương`);
        setSelectedIds(new Set());
      } catch (error) {
        toast.error("Lỗi khi xóa hàng loạt");
      } finally {
        setIsBulkActionLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Xóa chương này? Dữ liệu bản thảo sẽ không thể khôi phục.")) {
      try {
        await deleteChapter(id, storyId);
        toast.success("Đã xóa chương");
      } catch (error) {
        toast.error("Lỗi khi xóa chương");
      }
    }
  };

  const handleReorder = async (chapterId: string, direction: 'up' | 'down') => {
    try {
      await reorderChapters(storyId, chapterId, direction);
      toast.success("Đã cập nhật thứ tự chương");
    } catch (error) {
      toast.error("Lỗi khi sắp xếp chương");
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="text-center py-24 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/50">
        <p className="text-muted-foreground font-medium">Truyện chưa có chương nào. Hãy viết chương đầu tiên!</p>
      </div>
    );
  }

  const groupedChapters = volumes.map(volume => ({
    ...volume,
    chapters: chapters.filter(c => c.volume_id === volume.id)
  }));

  const orphanChapters = chapters.filter(c => !c.volume_id);

  return (
    <div className="space-y-12 pb-24">
      {/* Bulk Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-black text-primary-foreground shadow-lg shadow-primary/20">
                  {selectedIds.size}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Chương đã chọn</p>
                  <p className="text-xs font-bold text-white">Sẵn sàng thao tác</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={handleBulkPublish}
                  disabled={isBulkActionLoading}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                >
                  <Rocket className="w-3.5 h-3.5" /> Công khai
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest border-white/10 bg-white/5 text-white hover:bg-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkActionLoading}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest text-white/40 hover:text-white"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {groupedChapters.map((volume) => (
        <div key={volume.id} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">{volume.title}</h3>
              <span className="text-[10px] font-bold text-primary/40 px-2 bg-primary/5 rounded-md ml-2">
                {volume.chapters.length} chương
              </span>
            </div>
            
            {volume.chapters.length > 0 && (
              <button 
                onClick={() => toggleSelectAll(volume.chapters.map((c: any) => c.id))}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                {volume.chapters.every((c: any) => selectedIds.has(c.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                Chọn tất cả tập
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {volume.chapters.length === 0 ? (
              <div className="px-8 py-6 text-xs font-medium text-muted-foreground/40 italic bg-muted/5 rounded-2xl border border-dashed border-border/50">
                Chưa có chương nào trong tập này.
              </div>
            ) : (
              volume.chapters.map((chapter: any) => (
                <ChapterCard 
                  key={chapter.id} 
                  chapter={chapter} 
                  storyId={storyId} 
                  onDelete={handleDelete} 
                  onReorder={handleReorder}
                  isSelected={selectedIds.has(chapter.id)}
                  onToggleSelect={toggleSelect}
                />
              ))
            )}
          </div>
        </div>
      ))}

      {orphanChapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl border border-border w-fit">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chương lẻ / Phụ lục</h3>
              <span className="text-[10px] font-bold text-muted-foreground/40 px-2 bg-muted rounded-md ml-2">
                {orphanChapters.length} chương
              </span>
            </div>

            <button 
              onClick={() => toggleSelectAll(orphanChapters.map((c: any) => c.id))}
              className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              {orphanChapters.every((c: any) => selectedIds.has(c.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              Chọn tất cả chương lẻ
            </button>
          </div>
          <div className="grid gap-3">
            {orphanChapters.map((chapter) => (
              <ChapterCard 
                key={chapter.id} 
                chapter={chapter} 
                storyId={storyId} 
                onDelete={handleDelete} 
                onReorder={handleReorder}
                isSelected={selectedIds.has(chapter.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterCard({ 
  chapter, storyId, onDelete, onReorder, isSelected, onToggleSelect 
}: { 
  chapter: any, storyId: string, onDelete: (id: string) => void, 
  onReorder: (id: string, direction: 'up' | 'down') => void,
  isSelected: boolean, onToggleSelect: (id: string) => void
}) {
  return (
    <Card className={`group relative rounded-[1.5rem] border shadow-sm transition-all duration-300 overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]' : 'border-none shadow-black/[0.03]'}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <button 
          onClick={() => onToggleSelect(chapter.id)}
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            isSelected 
            ? 'bg-primary border-primary text-white' 
            : 'border-muted-foreground/20 hover:border-primary/40'
          }`}
        >
          {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {chapter.status === 'published' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
            )}
            <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
              {chapter.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-7">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {format(new Date(chapter.updated_at), "HH:mm, dd/MM", { locale: vi })}
            </span>
            <span className={chapter.status === 'published' ? 'text-emerald-500 font-black' : 'font-black'}>
              {chapter.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
            <div className="h-2.5 w-px bg-border/50 mx-1" />
            <span className="flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              {chapter.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5" />
              {chapter.comments?.[0]?.count || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 pr-2 border-r border-border/50">
            <button onClick={() => onReorder(chapter.id, 'up')} className="p-2 text-muted-foreground hover:text-primary transition-colors"><MoveUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => onReorder(chapter.id, 'down')} className="p-2 text-muted-foreground hover:text-primary transition-colors"><MoveDown className="w-3.5 h-3.5" /></button>
          </div>
          <EditChapterDialog chapter={chapter} storyId={storyId} />
          <Link href={`/admin/editor/${chapter.id}`} className="p-2.5 bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            <Edit3 className="w-4 h-4" />
          </Link>
          <button onClick={() => onDelete(chapter.id)} className="p-2.5 bg-muted text-muted-foreground rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-all duration-300">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
