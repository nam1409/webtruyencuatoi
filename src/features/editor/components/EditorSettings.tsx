"use client";

import { useState } from "react";
import { 
  Settings, Lock, Link as LinkIcon, Save, 
  Loader2, Key, Calendar, ShieldCheck, 
  ExternalLink, Clock, History
} from "lucide-react";
import { updateChapter } from "@/actions/chapters";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import slugify from "slugify";

interface EditorSettingsProps {
  chapter: any;
  volumes: any[];
  onUpdate: (updates: any) => Promise<void>;
}

export function EditorSettings({ chapter, volumes, onUpdate }: EditorSettingsProps) {
  const [slug, setSlug] = useState(chapter.slug || "");
  const [password, setPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState(chapter.password_hint || "");
  const [status, setStatus] = useState(chapter.status || "draft");
  const [volumeId, setVolumeId] = useState(chapter.volume_id || "none");
  const [scheduledAt, setScheduledAt] = useState(
    chapter.scheduled_at 
    ? new Date(chapter.scheduled_at).toISOString().slice(0, 16) 
    : ""
  );
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(!!chapter.password_hash);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    try {
      const updates: any = {
        slug: slugify(slug, { lower: true, strict: true }),
        status: status,
        volume_id: volumeId === "none" ? null : volumeId,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        password_hash: isPasswordEnabled ? (password || chapter.password_hash) : null,
        password_hint: isPasswordEnabled ? passwordHint : null
      };
      
      if (password) {
        updates.password_hash = password;
      }
      
      const updated = await updateChapter(chapter.id, updates);
      await onUpdate(updated);
      setPassword(""); 
      toast.success("Đã cập nhật thiết lập thành công!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật cài đặt");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 px-1 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Chapter Status Banner */}
      <div className="relative overflow-hidden p-5 bg-muted/20 rounded-[2rem] border border-border/60 shadow-sm group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <ShieldCheck className="w-16 h-16 text-primary" />
        </div>
        
        <div className="relative space-y-4">
          {/* Chapter Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Trạng thái chương
              </label>
              {chapter.published_at && (
                <span className="text-[9px] font-bold text-muted-foreground/40 italic">
                  Xuất bản: {new Date(chapter.published_at).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['draft', 'published', 'scheduled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    status === s 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {s === 'draft' ? 'Bản thảo' : s === 'published' ? 'Công khai' : 'Hẹn giờ'}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Thuộc tập truyện
            </label>
            <select
              value={volumeId}
              onChange={(e) => setVolumeId(e.target.value)}
              className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 font-bold text-sm appearance-none outline-none cursor-pointer focus:ring-2 ring-primary/20 transition-all"
            >
              <option value="none">Không thuộc tập nào</option>
              {volumes.map((v) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Trạng thái chương
            </label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${chapter.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${chapter.status === 'published' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {chapter.status === 'published' ? 'Công khai' : 'Bản nháp'}
              </span>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lần cuối</span>
            </div>
            <span className="text-xs font-bold text-foreground">
              {new Date(chapter.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-10 px-1">
        {/* URL Settings */}
        <div className="group space-y-4">
          <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors">
            <div className="p-2 bg-muted/20 rounded-xl border border-border group-focus-within:border-primary/20">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            Đường dẫn (URL)
          </label>
          <div className="space-y-3 pl-1">
            <Input 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="bg-transparent border-none border-b-2 border-border/60 rounded-none px-0 h-10 font-bold text-sm focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/30"
              placeholder="ten-chuong-khong-dau"
            />
            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-xl border border-dashed border-border">
              <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground/40 flex-shrink-0" />
              <p className="text-[9px] text-muted-foreground/60 leading-relaxed break-all">
                zenstory.vn/truyen/{chapter.stories?.slug}/<span className="text-primary font-bold underline decoration-primary/20 underline-offset-2">{slug || "..."}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scheduling Settings */}
        <div className="group space-y-4">
          <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors">
            <div className="p-2 bg-muted/20 rounded-xl border border-border group-focus-within:border-primary/20">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            Hẹn giờ đăng
          </label>
          <div className="pl-1">
            <Input 
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-muted/10 border-2 border-transparent border-b-border rounded-xl h-12 px-4 font-bold text-xs focus:bg-background focus:border-primary focus:ring-0 transition-all"
            />
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                {scheduledAt ? "Sẽ đăng vào thời gian trên" : "Để trống để đăng ngay"}
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="group space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors">
              <div className="p-2 bg-muted/20 rounded-xl border border-border group-focus-within:border-primary/20">
                <Lock className="w-3.5 h-3.5" />
              </div>
              Bảo mật chương
            </label>
            <Switch 
              checked={isPasswordEnabled} 
              onCheckedChange={(checked) => {
                setIsPasswordEnabled(checked);
                if (!checked) {
                  setPassword("");
                }
              }}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <div className={`relative pl-1 transition-all duration-500 ${!isPasswordEnabled ? 'opacity-30 blur-[1px] grayscale pointer-events-none' : 'opacity-100'}`}>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={chapter.password_hash ? "•••••••• (Đã có mật khẩu)" : "Nhập mật khẩu mới..."}
              className="rounded-xl bg-muted/30 border-none font-bold h-12 focus:ring-4 ring-primary/10 transition-all"
            />
            <p className="text-[9px] text-muted-foreground px-1">
              Chỉ những người có mật khẩu mới có thể đọc chương này.
            </p>
            
            <div className="pt-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Gợi ý mật khẩu</label>
              <Input 
                value={passwordHint}
                onChange={(e) => setPasswordHint(e.target.value)}
                placeholder="Ví dụ: Tên nhân vật chính là gì?"
                className="rounded-xl bg-muted/30 border-none font-bold h-12 text-sm focus:ring-4 ring-primary/10 transition-all"
              />
            </div>
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Update Button */}
        <div className="pt-6">
          <button
            onClick={handleUpdateSettings}
            disabled={isUpdating}
            className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-3 py-4 bg-[#1a1a1a] text-white rounded-[1.5rem] shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]">
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cập nhật thiết lập"}
            </span>
            {!isUpdating && <Save className="relative z-10 w-4 h-4 text-white/50 group-hover/btn:text-white transition-colors" />}
          </button>
        </div>
      </div>
    </div>
  );
}
