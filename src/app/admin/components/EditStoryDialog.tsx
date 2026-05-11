"use client";

import { useState, useRef } from "react";
import { Settings2, Loader2, BookOpen, Globe, AlignLeft, ImagePlus, X, Save, Heart, DollarSign, QrCode } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateStory } from "@/actions/stories";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface EditStoryDialogProps {
  story: any;
}

export function EditStoryDialog({ story }: EditStoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description || "");
  const [coverUrl, setCoverUrl] = useState(story.cover_url || "");
  
  // Metadata for monetization
  const [metadata, setMetadata] = useState(story.metadata || {});
  const [isUploadingQR, setIsUploadingQR] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cover') setIsUploading(true);
    else setIsUploadingQR(true);

    try {
      const url = await uploadImage(file, "covers");
      if (type === 'cover') setCoverUrl(url);
      else setMetadata({ ...metadata, qr_code_url: url });
      toast.success("Đã cập nhật ảnh");
    } catch (error) {
      toast.error("Lỗi khi tải lên ảnh");
    } finally {
      if (type === 'cover') setIsUploading(false);
      else setIsUploadingQR(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await updateStory(story.id, { 
        title, 
        description, 
        cover_url: coverUrl || null,
        metadata
      });
      toast.success("Đã cập nhật thông tin truyện!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-muted-foreground hover:text-primary">
          <Settings2 className="w-4 h-4" /> Cài đặt truyện
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            {/* Sidebar / Cover Area */}
            <div className="w-full md:w-72 bg-muted/30 border-r border-border/50 flex flex-col items-center p-8 gap-6 overflow-y-auto">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-full aspect-[2/3] bg-background rounded-[2rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden shadow-sm"
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Thay ảnh bìa</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" accept="image/*" />
              </div>
              
              <div className="space-y-4 w-full">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <Heart className="w-3 h-3" /> Tình trạng
                  </h4>
                  <p className="text-xs font-medium text-muted-foreground">Truyện của bạn đang ở chế độ công khai và có thể nhận ủng hộ.</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-8 pb-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">Cấu hình tác phẩm</DialogTitle>
                </DialogHeader>
              </div>

              <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 border-b border-border/50">
                  <TabsList className="bg-transparent h-12 p-0 gap-8">
                    <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest transition-all">Thông tin</TabsTrigger>
                    <TabsTrigger value="synopsis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest transition-all">Văn án</TabsTrigger>
                    <TabsTrigger value="support" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest transition-all">Ủng hộ</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6">
                  <TabsContent value="info" className="m-0 space-y-6 outline-none">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" /> Tiêu đề truyện
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="synopsis" className="m-0 space-y-6 outline-none">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <AlignLeft className="w-3.5 h-3.5" /> Văn án chi tiết
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập văn án hấp dẫn..."
                        className="w-full min-h-[300px] bg-muted/30 border-none rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none transition-all leading-relaxed"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="support" className="m-0 space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" /> Patreon Link
                        </label>
                        <Input
                          value={metadata.patreon_url || ""}
                          onChange={(e) => setMetadata({ ...metadata, patreon_url: e.target.value })}
                          placeholder="https://patreon.com/..."
                          className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" /> Buy Me a Coffee
                        </label>
                        <Input
                          value={metadata.buymeacoffee_url || ""}
                          onChange={(e) => setMetadata({ ...metadata, buymeacoffee_url: e.target.value })}
                          placeholder="https://buymeacoffee.com/..."
                          className="h-12 bg-muted/30 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5" /> Mã QR ủng hộ (MoMo/Bank)
                      </label>
                      <div 
                        onClick={() => qrInputRef.current?.click()}
                        className="w-40 aspect-square bg-muted/30 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative"
                      >
                        {metadata.qr_code_url ? (
                          <>
                            <OptimizedImage src={metadata.qr_code_url} alt="QR Code" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ImagePlus className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {isUploadingQR ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <QrCode className="w-5 h-5 text-muted-foreground" />}
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Tải mã QR</span>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={qrInputRef} onChange={(e) => handleImageUpload(e, 'qr')} className="hidden" accept="image/*" />
                    </div>
                  </TabsContent>
                </div>

                <div className="p-8 pt-4 border-t border-border/50 bg-muted/10 flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl font-bold uppercase tracking-widest text-[10px] h-12">
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isUploading || isUploadingQR} className="flex-[2] rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-primary/20 bg-primary">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu toàn bộ thay đổi
                  </Button>
                </div>
              </Tabs>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
