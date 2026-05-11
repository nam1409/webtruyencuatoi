"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, AlignLeft, ImagePlus, X, Save, Heart, DollarSign,
  QrCode, ChevronLeft, Loader2, Sparkles, LayoutGrid, Tag, ShieldCheck, Flag,
  Users,
  Layers, Lock, Calendar, WifiOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createStory, updateStory } from "@/actions/stories";
import { uploadImage } from "@/lib/storage";
import { CharacterManager } from "./CharacterManager";
import { VolumeManager } from "./VolumeManager";
import { toast } from "sonner";
import slugify from "slugify";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface StoryFormProps {
  initialData?: any;
  isEditing?: boolean;
  availableGenres?: string[];
}

export function StoryForm({ initialData, isEditing = false, availableGenres = [] }: StoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingQR, setIsUploadingQR] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_url || "");
  const [metadata, setMetadata] = useState(initialData?.metadata || {});

  // Extended Database Fields
  const [status, setStatus] = useState(initialData?.status || "ongoing");
  const [isProtected, setIsProtected] = useState(initialData?.is_protected || false);
  const [isPrivate, setIsPrivate] = useState(initialData?.is_private || false);
  const [genres, setGenres] = useState<string[]>(initialData?.genres || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [allowOffline, setAllowOffline] = useState(initialData?.allow_offline || false);
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduled_at
      ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
      : ""
  );

  // Professional Metadata
  const [authorName, setAuthorName] = useState(initialData?.author_name || "");
  const [source, setSource] = useState(initialData?.source || "");
  const [translatorName, setTranslatorName] = useState(initialData?.translator_name || "");
  const [ownerRole, setOwnerRole] = useState(initialData?.owner_role || "author");

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
      toast.success("Đã cập nhật ảnh thành công");
    } catch (error) {
      toast.error("Lỗi khi tải lên ảnh");
    } finally {
      if (type === 'cover') setIsUploading(false);
      else setIsUploadingQR(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề truyện");
      return;
    }

    setIsSubmitting(true);
    try {
      const storyData = {
        title,
        description,
        cover_url: coverUrl || null,
        status,
        is_protected: isProtected,
        is_private: isPrivate,
        genres,
        tags,
        metadata,
        author_name: authorName || null,
        source: source || null,
        translator_name: translatorName || null,
        owner_role: ownerRole,
        allow_offline: allowOffline,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
      };

      if (isEditing) {
        await updateStory(initialData.id, storyData);
        toast.success("Đã cập nhật thông tin truyện!");
      } else {
        const slug = slugify(title, { lower: true, strict: true });
        const newStory = await createStory({ ...storyData, slug });
        toast.success("Đã tạo truyện mới thành công!");
        router.push(`/admin/stories/${newStory.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 md:space-y-10 px-0 md:px-4">
      {/* Header Bar - More Minimalist & Responsive */}
      <div className="sticky top-0 flex items-center justify-between py-4 md:py-6 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 md:px-2 -mx-4 md:mx-0">
        <div className="flex items-center gap-3 md:gap-5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full w-8 h-8 md:w-10 md:h-10 border-border/40 hover:bg-muted/50"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none mb-1 truncate max-w-[150px] md:max-w-none">
              {isEditing ? "Cài đặt" : "Khởi tạo"}
            </h1>
            <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50 hidden xs:block">
              {isEditing ? "Management" : "Creative Journey"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-3 md:px-6 opacity-60 hover:opacity-100 hidden sm:block"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading || isUploadingQR}
            className="rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />}
            {isEditing ? "Lưu" : "Tạo ngay"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 px-4 md:px-0">
        {/* Left Column: Media & Quick Info */}
        <div className="lg:col-span-4 space-y-8 md:space-y-10 order-2 lg:order-1">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Ảnh bìa
              </label>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-full max-w-[280px] mx-auto lg:max-w-none aspect-[2/3] bg-muted/20 rounded-3xl border border-border/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all overflow-hidden"
            >
              {coverUrl ? (
                <>
                  <OptimizedImage src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Button variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full text-xs">
                      <ImagePlus className="w-4 h-4 mr-2" /> Đổi ảnh
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-background rounded-2xl flex items-center justify-center shadow-sm">
                    {isUploading ? <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" /> : <ImagePlus className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold">Tải ảnh bìa</p>
                    <p className="text-[9px] md:text-[10px] font-bold mt-1 opacity-60">600x900px</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" accept="image/*" />
            </div>
            {coverUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl("")} className="w-full text-destructive/60 hover:text-destructive hover:bg-destructive/5 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
                Xóa ảnh bìa
              </Button>
            )}
          </section>

          <section className="p-6 md:p-8 bg-muted/10 rounded-3xl border border-border/30 space-y-4 md:space-y-6">
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
              Mẹo sáng tác
            </h4>
            <div className="space-y-3 md:space-y-4">
              {[
                "Tiêu đề hấp dẫn sẽ tăng 40% lượt click.",
                "Văn án nên có các tình tiết gây tò mò.",
                "Cập nhật chương đều đặn mỗi tuần."
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 md:gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5" />
                  <p className="text-[11px] md:text-xs font-medium text-muted-foreground/80 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Detailed Settings */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <Tabs defaultValue="content" className="w-full">
            <div className="mb-6 md:mb-10 -mx-4 px-4 overflow-x-auto no-scrollbar scroll-smooth">
              <TabsList className="bg-transparent p-0 h-auto gap-6 md:gap-8 border-b border-border/40 rounded-none w-max md:w-full justify-start pb-0">
                <TabsTrigger value="content" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Cơ bản
                </TabsTrigger>
                <TabsTrigger value="classification" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Phân loại
                </TabsTrigger>
                <TabsTrigger value="creative" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Sáng tác
                </TabsTrigger>
                <TabsTrigger value="characters" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Nhân vật
                </TabsTrigger>
                <TabsTrigger value="volumes" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Tập truyện
                </TabsTrigger>
                <TabsTrigger value="monetization" className="rounded-none px-0 py-3 md:py-4 font-black text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.15em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100 whitespace-nowrap">
                  Ủng hộ
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="space-y-6 md:space-y-10 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                  Tiêu đề tác phẩm
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên truyện..."
                  className="h-12 md:h-16 bg-muted/10 border-border/40 rounded-xl md:rounded-2xl px-4 md:px-6 font-black text-base md:text-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                  Văn án
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu lôi cuốn về truyện của bạn..."
                  className="w-full min-h-[300px] md:min-h-[450px] bg-muted/10 border border-border/40 rounded-2xl md:rounded-3xl p-6 md:p-8 text-sm md:text-base font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all leading-relaxed resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="classification" className="space-y-8 md:space-y-12 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Status & Security */}
                <div className="space-y-8 md:space-y-10">
                  <div className="space-y-4 md:space-y-5">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                      Trạng thái
                    </label>
                    <div className="flex gap-2 p-1 bg-muted/20 rounded-2xl">
                      {['ongoing', 'completed', 'hiatus'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`flex-1 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${status === s
                            ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                            : 'text-muted-foreground/60 hover:text-muted-foreground'
                            }`}
                        >
                          {s === 'ongoing' ? 'Đang ra' : s === 'completed' ? 'Xong' : 'Ngưng'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 md:p-6 bg-muted/10 rounded-2xl md:rounded-3xl border border-border/30 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-black flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" /> Bảo vệ
                          </label>
                          <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground/50 leading-none">Chống copy và reup</p>
                        </div>
                        <Switch
                          checked={isProtected}
                          onCheckedChange={setIsProtected}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-black flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" /> Riêng tư
                          </label>
                          <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground/50 leading-none">Chỉ cấp quyền mới xem</p>
                        </div>
                        <Switch
                          checked={isPrivate}
                          onCheckedChange={setIsPrivate}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-xs md:text-sm font-black flex items-center gap-2">
                            <WifiOff className="w-4 h-4 text-primary" /> Đọc Offline
                          </label>
                          <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground/50 leading-none">Cho phép tải và mã hóa</p>
                        </div>
                        <Switch
                          checked={allowOffline}
                          onCheckedChange={setAllowOffline}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Hẹn giờ ra mắt
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="h-12 md:h-14 bg-muted/10 border-border/40 rounded-xl px-4 md:px-5 font-bold focus:ring-4 focus:ring-primary/5"
                      />
                      <p className="text-[10px] text-muted-foreground/40 italic px-1 leading-relaxed">
                        {scheduledAt ? "Truyện sẽ tự động hiển thị vào lúc này." : "Để trống nếu muốn truyện hiện lên ngay khi được xuất bản (ongoing/completed)."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags Management */}
                <div className="space-y-4 md:space-y-5">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                    Thẻ từ khóa
                  </label>
                  <div className="space-y-4">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder="Tag + Enter..."
                      className="h-12 md:h-14 bg-muted/10 border-border/40 rounded-xl px-4 md:px-5 font-bold focus:ring-4 focus:ring-primary/5"
                    />
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <div
                          key={tag}
                          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-background border border-border/40 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest group hover:border-destructive/30 transition-all"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="opacity-40 hover:opacity-100 hover:text-destructive transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Genre Selection */}
              <div className="space-y-4 md:space-y-6">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                  Thể loại
                </label>
                <div className="flex flex-wrap gap-2 md:gap-2.5">
                  {availableGenres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${genres.includes(genre)
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                        : 'bg-muted/10 text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground'
                        }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creative" className="space-y-8 md:space-y-12 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Tên tác giả gốc
                    </label>
                    <Input
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Tên tác giả thực tế của truyện..."
                      className="h-14 bg-muted/10 border-border/40 rounded-xl px-5 font-bold focus:ring-4 focus:ring-primary/5"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Nguồn truyện / Dẫn nguồn
                    </label>
                    <Input
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="Link gốc hoặc tên nguồn..."
                      className="h-14 bg-muted/10 border-border/40 rounded-xl px-5 font-bold focus:ring-4 focus:ring-primary/5"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Tên dịch giả / Nhóm dịch
                    </label>
                    <Input
                      value={translatorName}
                      onChange={(e) => setTranslatorName(e.target.value)}
                      placeholder="Để trống nếu bạn là tác giả..."
                      className="h-14 bg-muted/10 border-border/40 rounded-xl px-5 font-bold focus:ring-4 focus:ring-primary/5"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" /> Vai trò của bạn
                    </label>
                    <div className="flex gap-2 p-1 bg-muted/20 rounded-2xl">
                      {[
                        { id: 'author', label: 'Tác giả' },
                        { id: 'translator', label: 'Dịch giả' },
                        { id: 'contractor', label: 'Nhà thầu' }
                      ].map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setOwnerRole(role.id)}
                          className={`flex-1 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${ownerRole === role.id
                            ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                            : 'text-muted-foreground/60 hover:text-muted-foreground'
                            }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="characters" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              {isEditing ? (
                <CharacterManager storyId={initialData.id} />
              ) : (
                <div className="py-24 text-center bg-muted/10 rounded-3xl border border-dashed border-border/40">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Users className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-black mb-2 opacity-80">Chưa thể thiết lập nhân vật</h3>
                  <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest max-w-xs mx-auto">
                    Vui lòng khởi tạo truyện để bắt đầu quản lý danh sách nhân vật và thiết lập tooltip.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="volumes" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              {isEditing ? (
                <VolumeManager storyId={initialData.id} />
              ) : (
                <div className="py-24 text-center bg-muted/10 rounded-3xl border border-dashed border-border/40">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Layers className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-black mb-2 opacity-80">Chưa thể tạo tập truyện</h3>
                  <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest max-w-xs mx-auto">
                    Vui lòng khởi tạo truyện để bắt đầu xây dựng cấu trúc các tập truyện.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monetization" className="space-y-10 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                    Patreon Link
                  </label>
                  <Input
                    value={metadata.patreon_url || ""}
                    onChange={(e) => setMetadata({ ...metadata, patreon_url: e.target.value })}
                    placeholder="https://patreon.com/your-name"
                    className="h-14 bg-muted/10 border-border/40 rounded-xl px-5 font-bold focus:ring-4 focus:ring-primary/5"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                    Buy Me a Coffee
                  </label>
                  <Input
                    value={metadata.buymeacoffee_url || ""}
                    onChange={(e) => setMetadata({ ...metadata, buymeacoffee_url: e.target.value })}
                    placeholder="https://buymeacoffee.com/your-name"
                    className="h-14 bg-muted/10 border-border/40 rounded-xl px-5 font-bold focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">
                  Mã QR ủng hộ
                </label>
                <div
                  onClick={() => qrInputRef.current?.click()}
                  className="w-64 aspect-square bg-muted/10 rounded-3xl border border-border/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all overflow-hidden relative"
                >
                  {metadata.qr_code_url ? (
                    <>
                      <OptimizedImage src={metadata.qr_code_url} alt="QR Code" className="w-full h-full object-contain p-6" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full">
                          Đổi mã QR
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-8 text-center opacity-40">
                      <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-sm">
                        {isUploadingQR ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <QrCode className="w-8 h-8" />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Tải lên mã QR</p>
                    </div>
                  )}
                </div>
                <input type="file" ref={qrInputRef} onChange={(e) => handleImageUpload(e, 'qr')} className="hidden" accept="image/*" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </form>
  );
}
