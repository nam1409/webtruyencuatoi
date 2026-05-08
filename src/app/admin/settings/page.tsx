"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Shield, UserPlus, Zap, Bell, Globe, Loader2, Tag, X, Sparkles, User, Image as ImageIcon, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicProfile, updateProfile } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings, updateSiteSettings, updateMultipleSiteSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Input } from "@base-ui/react";
import { IconUploader } from "../components/IconUploader";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("system");
  
  // Site Settings
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    allow_registration: true,
    email_notifications: true,
    force_https: true,
    site_language: "vi",
    site_name: "ZenStory",
    favicon_url: "",
    apple_icon_url: "",
    logo_url: "",
    site_genres: ["Tiên Hiệp", "Kiếm Hiệp", "Đam mỹ", "Đô Thị", "Huyền Huyễn", "Hệ Thống", "Dị Giới", "Võng Du", "Trọng Sinh", "Mạt Thế", "Xuyên Không"]
  });

  // User Profile
  const [profile, setProfile] = useState({
    id: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    location: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const [settingsData, profileData] = await Promise.all([
          getSiteSettings(),
          getPublicProfile(user.id)
        ]);
        
        if (settingsData) setSettings(prev => ({ ...prev, ...settingsData }));
        if (profileData) setProfile(prev => ({ ...prev, ...profileData }));
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleSaveSystem = async () => {
    setSaving(true);
    try {
      await updateMultipleSiteSettings(settings);
      toast.success("Đã cập nhật cài đặt hệ thống!");
    } catch (error) {
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success("Đã cập nhật hồ sơ cá nhân!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật hồ sơ");
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
    <div className="py-12 px-8 space-y-8">
      <Tabs defaultValue="system" onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground">Thiết lập</h1>
            <TabsList className="bg-muted/50 p-1 rounded-2xl">
              <TabsTrigger value="system" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Hệ thống</TabsTrigger>
              <TabsTrigger value="personal" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Cá nhân</TabsTrigger>
            </TabsList>
          </div>
          
          <Button 
            onClick={activeTab === "system" ? handleSaveSystem : handleSaveProfile} 
            disabled={saving}
            size="lg"
            className="rounded-2xl font-black uppercase tracking-widest px-10 h-14 shadow-2xl shadow-primary/20 hover:scale-105 transition-all bg-gradient-to-r from-primary to-purple-600"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu thay đổi
          </Button>
        </div>

        <TabsContent value="system" className="space-y-12 mt-0 outline-none">
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
                    className="rounded-2xl bg-muted/30 border-none font-black h-14 text-lg w-full"
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

            {/* Branding & Assets */}
            <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-3 text-primary">
                <Sparkles className="w-6 h-6" />
                <h2 className="font-black uppercase tracking-[0.2em] text-xs">Thương hiệu & Hình ảnh</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <IconUploader 
                  label="Logo Website"
                  value={settings.logo_url}
                  onChange={url => setSettings({...settings, logo_url: url})}
                  path="logo"
                  aspectRatio="aspect-video"
                  description="Logo chính hiển thị trên Header."
                />

                <IconUploader 
                  label="Favicon"
                  value={settings.favicon_url}
                  onChange={url => setSettings({...settings, favicon_url: url})}
                  path="favicon"
                  description="Biểu tượng tab trình duyệt."
                />

                <IconUploader 
                  label="Apple Touch Icon"
                  value={settings.apple_icon_url}
                  onChange={url => setSettings({...settings, apple_icon_url: url})}
                  path="apple-icon"
                  description="Biểu tượng khi lưu vào màn hình chính."
                />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
                <div className="flex items-center gap-3 text-primary">
                  <User className="w-6 h-6" />
                  <h2 className="font-black uppercase tracking-[0.2em] text-xs">Thông tin cá nhân</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tên hiển thị</label>
                    <Input 
                      value={profile.display_name}
                      onChange={e => setProfile({...profile, display_name: e.target.value})}
                      className="rounded-2xl bg-muted/30 border-none font-black h-14 text-lg w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tiểu sử (Bio)</label>
                    <textarea 
                      value={profile.bio}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                      placeholder="Viết gì đó về bản thân bạn..."
                      className="w-full min-h-[150px] rounded-2xl bg-muted/30 border-none font-medium p-4 focus:ring-2 ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Vị trí / Quê quán</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={profile.location}
                        onChange={e => setProfile({...profile, location: e.target.value})}
                        className="rounded-2xl bg-muted/30 border-none font-bold h-14 pl-12 w-full"
                        placeholder="Ví dụ: Hà Nội, Việt Nam"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
                <div className="flex items-center gap-3 text-primary">
                  <ImageIcon className="w-6 h-6" />
                  <h2 className="font-black uppercase tracking-[0.2em] text-xs">Hình ảnh cá nhân</h2>
                </div>

                <div className="space-y-8">
                  <IconUploader 
                    label="Avatar (Ảnh đại diện)"
                    value={profile.avatar_url}
                    onChange={url => setProfile({...profile, avatar_url: url})}
                    path="avatars"
                    description="Kích thước vuông 1:1."
                  />

                  <IconUploader 
                    label="Banner (Ảnh bìa Profile)"
                    value={profile.banner_url}
                    onChange={url => setProfile({...profile, banner_url: url})}
                    path="banners"
                    aspectRatio="aspect-video"
                    description="Hiển thị trên đầu trang cá nhân."
                  />
                </div>
              </section>
            </div>
          </div>
        </TabsContent>
      </Tabs>
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
