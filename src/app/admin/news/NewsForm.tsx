"use client";

import { useState } from "react";
import { Plus, Loader2, Megaphone, Sparkles, Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { createNews } from "@/actions/news";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function NewsForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Thông báo");
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    setSaving(true);
    try {
      await createNews({
        title,
        content,
        category,
        is_pinned: isPinned
      });
      toast.success("Đã đăng tin thành công!");
      setOpen(false);
      // Reset form
      setTitle("");
      setContent("");
      setIsPinned(false);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi đăng tin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 group">
          <Plus className="mr-2 w-5 h-5 group-hover:rotate-90 transition-transform" />
          Thêm bài đăng mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 border-none bg-background/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden rounded-[3rem]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Custom Header */}
          <div className="flex items-center justify-between p-8 border-b border-border/50 bg-background/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tighter">Sáng tạo tin tức</DialogTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ZenStory Creative Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <Button 
                type="button"
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="rounded-2xl h-12 px-6 font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng bài ngay"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Title & Options Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tiêu đề bài viết</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề ấn tượng cho bài viết..."
                  className="w-full h-16 bg-muted/30 border-none rounded-[1.5rem] p-6 text-2xl font-black tracking-tight focus:ring-2 ring-primary/20 transition-all outline-none"
                  required
                />
              </div>

              <div className="lg:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Chuyên mục</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-16 bg-muted/30 border-none rounded-[1.5rem] p-4 px-6 text-sm font-black uppercase tracking-widest focus:ring-2 ring-primary/20 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Thông báo">📢 Thông báo</option>
                  <option value="Cập nhật">🚀 Cập nhật</option>
                  <option value="Sự kiện">🎉 Sự kiện</option>
                </select>
              </div>

              <div className="lg:col-span-2 flex flex-col justify-end">
                <label className={cn(
                  "flex items-center h-16 gap-3 p-4 px-6 rounded-[1.5rem] cursor-pointer transition-all group border-2",
                  isPinned ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}>
                  <input 
                    type="checkbox" 
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="hidden" 
                  />
                  <Pin className={cn("w-5 h-5", isPinned ? "fill-current" : "")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ghim bài</span>
                </label>
              </div>
            </div>

            {/* Editor Area */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Nội dung bài viết (Trình soạn thảo Zen Pro)
              </label>
              <div className="min-h-[500px] rounded-[2.5rem] overflow-hidden border border-border/50 bg-background/50 shadow-inner p-2">
                <TiptapEditor 
                  initialContent={content}
                  onChange={() => {}}
                  onHtmlChange={(html) => setContent(html)}
                />
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
