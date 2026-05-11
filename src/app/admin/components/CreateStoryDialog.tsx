"use client";

import { useState, useRef } from "react";
import { Plus, Loader2, BookOpen, Globe, AlignLeft, ImagePlus, X } from "lucide-react";
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
import { createStory } from "@/actions/stories";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import slugify from "slugify";
import Image from "next/image";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export function CreateStoryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file, "covers");
      setCoverUrl(url);
      toast.success("Đã tải lên ảnh bìa");
    } catch (error) {
      toast.error("Lỗi khi tải lên ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = slugify(title, { lower: true, strict: true });
      await createStory({ 
        title, 
        description, 
        slug,
        cover_url: coverUrl || undefined 
      });
      toast.success("Đã tạo truyện mới thành công!");
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo truyện");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCoverUrl("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button className="rounded-2xl font-black uppercase tracking-widest h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="mr-2 w-5 h-5" /> Viết truyện mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row">
            {/* Image Upload Area */}
            <div className="w-full md:w-64 bg-muted/30 border-r border-border/50 flex flex-col items-center justify-center p-8 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-full aspect-[2/3] bg-background rounded-[2rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
              >
                {coverUrl ? (
                  <>
                    <OptimizedImage src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ImagePlus className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ảnh bìa</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                Kích thước gợi ý: 600x900px. <br/> Hỗ trợ JPG, PNG.
              </p>
              {coverUrl && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCoverUrl("")}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <X className="w-3 h-3 mr-2" /> Xóa ảnh
                </Button>
              )}
            </div>

            {/* Form Content */}
            <div className="flex-1 p-8 space-y-8">
              <DialogHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">Bắt đầu tác phẩm mới</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  Điền thông tin cơ bản để khởi tạo bản thảo truyện của bạn.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Tiêu đề truyện
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Tiên Nghịch, Phàm Nhân Tu Tiên..."
                    className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold placeholder:font-normal placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <AlignLeft className="w-3.5 h-3.5" /> Mô tả ngắn
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tóm tắt nội dung hấp dẫn để thu hút độc giả..."
                    className="w-full min-h-[120px] bg-muted/30 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex-[2] rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-primary/10"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    "Khởi tạo truyện"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
