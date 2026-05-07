"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, FileText, Globe, Layers } from "lucide-react";
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
import { createChapter } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { toast } from "sonner";
import slugify from "slugify";

export function CreateChapterDialog({ storyId }: { storyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [volumes, setVolumes] = useState<any[]>([]);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>("");

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
      await createChapter(storyId, title, slug, selectedVolumeId || null);
      toast.success("Đã thêm chương mới!");
      setIsOpen(false);
      setTitle("");
      setSelectedVolumeId("");
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button className="w-full md:w-auto rounded-2xl font-black uppercase tracking-widest h-14 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" />
        <Plus className="mr-2 w-5 h-5" /> Thêm chương mới
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Viết chương mới</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Nhập tiêu đề cho chương bản thảo tiếp theo.
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
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                  <Globe className="w-3.5 h-3.5" /> Tiêu đề chương
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Sự khởi đầu..."
                  className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold placeholder:font-normal placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20"
                  required
                />
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
              Để sau
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Bắt đầu viết"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
