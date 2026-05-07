"use client";

import { useEffect, useState } from "react";
import { Settings2, Loader2, FileText, Globe, Layers, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateChapter } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { toast } from "sonner";
import slugify from "slugify";

interface EditChapterDialogProps {
  chapter: any;
  storyId: string;
}

export function EditChapterDialog({ chapter, storyId }: EditChapterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(chapter.volume_id || "");
  const [scheduledAt, setScheduledAt] = useState(chapter.scheduled_at ? new Date(chapter.scheduled_at).toISOString().slice(0, 16) : "");

  useEffect(() => {
    if (isOpen) {
      getVolumesByStory(storyId).then(setVolumes);
    }
  }, [isOpen, storyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = slugify(title, { lower: true, strict: true });
      await updateChapter(chapter.id, {
        title,
        slug,
        volume_id: selectedVolumeId || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
      });
      toast.success("Đã cập nhật thông tin chương!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <button
          className="p-2.5 bg-muted text-muted-foreground rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
          title="Cấu hình chương"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Settings2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Cài đặt chương</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Thay đổi tiêu đề hoặc chuyển chương sang tập (volume) khác.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                  <Layers className="w-3.5 h-3.5" /> Thuộc tập (Volume)
                </label>
                <select
                  value={selectedVolumeId}
                  onChange={(e) => setSelectedVolumeId(e.target.value)}
                  className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Không thuộc tập nào</option>
                  {volumes.map((v) => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground/60 italic px-1">Chọn tập mới để di chuyển chương này.</p>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                  <Globe className="w-3.5 h-3.5" /> Tiêu đề chương
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                  <Calendar className="w-3.5 h-3.5" /> Hẹn giờ đăng
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground/60 italic px-1">Để trống nếu muốn đăng ngay lập tức.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 p-6 flex flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
