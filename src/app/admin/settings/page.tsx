"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Shield, UserPlus, Zap, Bell, Globe, Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSiteSettings, updateSiteSettings } from "@/actions/settings";
import { Input } from "@base-ui/react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    allow_registration: true,
    email_notifications: true,
    force_https: true,
    site_language: "vi",
    site_name: "ZenStory",
    site_genres: ["Tiên Hiệp", "Kiếm Hiệp", "Ngôn Tình", "Đô Thị", "Huyền Huyễn", "Hệ Thống", "Dị Giới", "Võng Du", "Trọng Sinh", "Mạt Thế", "Xuyên Không"]
  });

  useEffect(() => {
    getSiteSettings().then(data => {
      setSettings(prev => ({ ...prev, ...data }));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        updateSiteSettings(key, value)
      );
      await Promise.all(promises);
      toast.success("Đã cập nhật cài đặt hệ thống!");
    } catch (error) {
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-12 px-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Cài đặt hệ thống</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg italic">
            Cấu hình các tham số vận hành cốt lõi của website.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="rounded-2xl font-black uppercase tracking-widest px-10 h-14 shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Access & Security */}
        <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <Shield className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-[0.2em] text-xs">Bảo mật & Truy cập</h2>
          </div>

          <div className="space-y-6">
            <SettingToggle 
              icon={<Zap className="w-4 h-4" />}
              label="Chế độ bảo trì"
              description="Chỉ quản trị viên mới có thể truy cập website."
              checked={settings.maintenance_mode}
              onChange={(val) => setSettings({...settings, maintenance_mode: val})}
            />
            <SettingToggle 
              icon={<UserPlus className="w-4 h-4" />}
              label="Cho phép đăng ký"
              description="Người dùng mới có thể tạo tài khoản độc giả."
              checked={settings.allow_registration}
              onChange={(val) => setSettings({...settings, allow_registration: val})}
            />
            <SettingToggle 
              icon={<Globe className="w-4 h-4" />}
              label="Bắt buộc HTTPS"
              description="Tự động chuyển hướng mọi truy cập sang giao thức bảo mật."
              checked={settings.force_https}
              onChange={(val) => setSettings({...settings, force_https: val})}
            />
          </div>
        </section>

        {/* Website Information */}
        <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <Globe className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-[0.2em] text-xs">Thông tin Website</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tên Website</label>
              <Input 
                value={settings.site_name}
                onChange={e => setSettings({...settings, site_name: e.target.value})}
                className="rounded-2xl bg-muted/30 border-none font-black h-14 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Ngôn ngữ mặc định</label>
              <select 
                value={settings.site_language}
                onChange={e => setSettings({...settings, site_language: e.target.value})}
                className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 font-bold appearance-none outline-none cursor-pointer"
              >
                <option value="vi">Tiếng Việt (Mặc định)</option>
                <option value="en">English (Coming soon)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Story Genres */}
        <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 text-primary">
            <Tag className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-[0.2em] text-xs">Danh sách thể loại truyện</h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {settings.site_genres.map((genre, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border/50 group"
                >
                  <span className="text-xs font-bold">{genre}</span>
                  <button 
                    onClick={() => setSettings({
                      ...settings,
                      site_genres: settings.site_genres.filter((_, i) => i !== index)
                    })}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input 
                id="new-genre-input"
                className="rounded-xl bg-muted/30 border-none font-bold h-12 max-w-xs"
                placeholder="Thêm thể loại mới..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !settings.site_genres.includes(val)) {
                      setSettings({
                        ...settings,
                        site_genres: [...settings.site_genres, val]
                      });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <Button 
                variant="outline" 
                className="rounded-xl border-primary text-primary font-bold hover:bg-primary/5 h-12 shrink-0 px-6"
                onClick={() => {
                  const input = document.getElementById('new-genre-input') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !settings.site_genres.includes(val)) {
                    setSettings({
                      ...settings,
                      site_genres: [...settings.site_genres, val]
                    });
                    input.value = "";
                  }
                }}
              >
                Thêm
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <Bell className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-[0.2em] text-xs">Thông báo & Email</h2>
          </div>

          <div className="space-y-6">
            <SettingToggle 
              icon={<Bell className="w-4 h-4" />}
              label="Thông báo Email"
              description="Gửi email khi có chương mới hoặc bình luận mới."
              checked={settings.email_notifications}
              onChange={(val) => setSettings({...settings, email_notifications: val})}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingToggle({ icon, label, description, checked, onChange }: { icon: React.ReactNode, label: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 hover:bg-muted/40 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="space-y-0.5">
          <h3 className="font-bold text-sm">{label}</h3>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <Switch 
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
