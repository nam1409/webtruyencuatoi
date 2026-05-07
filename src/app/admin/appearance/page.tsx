"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Save, 
  Loader2,
  Type,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Palette
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AppearancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    site_description: "",
    primary_color: "#8b5cf6",
    primary_font: "font-serif",
    default_theme: "light",
    google_font: "",
    enable_canvas: true,
    custom_themes: [] as any[],
    custom_fonts: [] as any[],
  });

  useEffect(() => {
    getSiteSettings().then((settingsData) => {
      setSettings(prev => ({
        ...prev,
        ...settingsData,
      }));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(settings)
        .filter(([key]) => key !== "id" && key !== "updated_at")
        .map(([key, value]) => 
          updateSiteSettings(key, value)
        );
      await Promise.all(promises);
      toast.success("Đã cập nhật giao diện website!");
    } catch (error) {
      toast.error("Lỗi khi lưu cài đặt");
      console.error(error);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">
            Giao diện Website
          </h1>
          <p className="text-muted-foreground font-medium text-lg italic">
            Cá nhân hóa phong cách hiển thị và thương hiệu.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="rounded-2xl font-black uppercase tracking-widest px-10 h-14 shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Branding & Style */}
          <section className="bg-card border border-border/50 rounded-[3rem] p-10 md:p-12 space-y-8 shadow-sm">
            <div className="flex items-center gap-3 text-primary">
              <Palette className="w-6 h-6" />
              <h2 className="font-black uppercase tracking-[0.2em] text-xs">Thương hiệu & Phong cách</h2>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Khẩu hiệu / Badge (Hero Badge)</label>
                <Input 
                  value={settings.site_description}
                  onChange={e => setSettings({...settings, site_description: e.target.value})}
                  className="rounded-2xl bg-muted/30 border-none font-bold h-14 text-lg"
                  placeholder="Ví dụ: PHIÊN BẢN ELITE 2026 ĐÃ SẴN SÀNG"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Màu sắc chủ đạo (Primary)</label>
                  <div className="flex gap-4">
                    <input 
                      type="color" 
                      value={settings.primary_color}
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent shrink-0 shadow-lg"
                    />
                    <Input 
                      value={settings.primary_color}
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1 rounded-2xl bg-muted/30 border-none font-mono font-bold h-14"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Theme mặc định</label>
                  <select 
                    value={settings.default_theme}
                    onChange={e => setSettings({...settings, default_theme: e.target.value})}
                    className="w-full h-14 bg-muted/30 border-none rounded-2xl px-6 font-bold appearance-none outline-none cursor-pointer"
                  >
                    <option value="light">Sáng (Light)</option>
                    <option value="dark">Tối (Dark)</option>
                    <option value="oled">OLED (Black)</option>
                    <option value="sepia">Sepia (Cổ điển)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Type className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google Font (Tên font)</label>
                  </div>
                  <Input 
                    value={settings.google_font || ""}
                    onChange={e => setSettings({...settings, google_font: e.target.value})}
                    className="rounded-2xl bg-muted/30 border-none font-bold h-14"
                    placeholder="Ví dụ: Outfit, Inter..."
                  />
                  <p className="text-[9px] text-muted-foreground italic px-1">Nhập tên font từ Google Fonts để áp dụng toàn trang.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Font chữ hệ thống (Fallback)</label>
                  <select 
                    value={settings.primary_font || "font-serif"}
                    onChange={e => setSettings({...settings, primary_font: e.target.value})}
                    className="w-full h-14 bg-muted/30 border-none rounded-2xl px-6 font-bold appearance-none outline-none cursor-pointer"
                  >
                    <option value="font-serif">Serif (Có chân)</option>
                    <option value="font-sans">Sans-serif (Không chân)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Reader Customization (Themes & Fonts) */}
          <section className="bg-card border border-border/50 rounded-[3rem] p-10 md:p-12 space-y-10 shadow-sm">
            <div className="flex items-center gap-3 text-primary">
              <SettingsIcon className="w-6 h-6" />
              <h2 className="font-black uppercase tracking-[0.2em] text-xs">Tùy chỉnh Reader chuyên sâu</h2>
            </div>

            {/* Custom Themes Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Danh sách Theme tùy chỉnh</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-8 text-[9px] font-black uppercase tracking-widest"
                  onClick={() => {
                    const newThemes = [...(settings.custom_themes || []), {
                      id: `custom-${Date.now()}`,
                      name: "Theme mới",
                      bg: "#ffffff",
                      text: "#000000"
                    }];
                    setSettings({...settings, custom_themes: newThemes});
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Thêm Theme
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.custom_themes?.map((theme, idx) => (
                  <div key={theme.id} className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <Input 
                        value={theme.name}
                        onChange={e => {
                          const updated = [...settings.custom_themes];
                          updated[idx].name = e.target.value;
                          setSettings({...settings, custom_themes: updated});
                        }}
                        className="bg-transparent border-none font-bold text-sm h-8 p-0 focus-visible:ring-0"
                      />
                      <button 
                        onClick={() => {
                          const updated = settings.custom_themes.filter((_, i) => i !== idx);
                          setSettings({...settings, custom_themes: updated});
                        }}
                        className="p-1 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Màu nền</p>
                        <div className="flex gap-2">
                          <input type="color" value={theme.bg} onChange={e => {
                             const updated = [...settings.custom_themes];
                             updated[idx].bg = e.target.value;
                             setSettings({...settings, custom_themes: updated});
                          }} className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent" />
                          <span className="text-[10px] font-mono font-bold">{theme.bg}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Màu chữ</p>
                        <div className="flex gap-2">
                          <input type="color" value={theme.text} onChange={e => {
                             const updated = [...settings.custom_themes];
                             updated[idx].text = e.target.value;
                             setSettings({...settings, custom_themes: updated});
                          }} className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent" />
                          <span className="text-[10px] font-mono font-bold">{theme.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
                
            <Separator className="opacity-30" />

            {/* Custom Fonts Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Danh sách Font tùy chỉnh</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-8 text-[9px] font-black uppercase tracking-widest"
                  onClick={() => {
                    const newFonts = [...(settings.custom_fonts || []), {
                      id: `font-${Date.now()}`,
                      name: "Font mới",
                      fontFamily: "Inter"
                    }];
                    setSettings({...settings, custom_fonts: newFonts});
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Thêm Font
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.custom_fonts?.map((font, idx) => (
                  <div key={font.id} className="p-5 bg-muted/20 rounded-3xl border border-border/40 flex flex-col gap-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Tên hiển thị (Ví dụ: Font Hiện Đại)</label>
                        <Input 
                          value={font.name}
                          onChange={e => {
                            const updated = [...settings.custom_fonts];
                            updated[idx].name = e.target.value;
                            setSettings({...settings, custom_fonts: updated});
                          }}
                          className="bg-background border-2 border-border/20 font-bold text-sm h-10 px-4 rounded-xl focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Tên Google Font (Ví dụ: Roboto)</label>
                        <Input 
                          value={font.fontFamily}
                          onChange={e => {
                            const updated = [...settings.custom_fonts];
                            updated[idx].fontFamily = e.target.value;
                            setSettings({...settings, custom_fonts: updated});
                          }}
                          className="bg-muted/40 border-none font-mono text-[10px] h-10 px-4 rounded-xl"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const updated = settings.custom_fonts.filter((_, i) => i !== idx);
                        setSettings({...settings, custom_fonts: updated});
                      }}
                      className="text-destructive hover:bg-destructive/10 rounded-xl font-bold text-[10px] uppercase tracking-widest h-8"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Xóa phông chữ
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60 italic px-1">* Nhập chính xác tên font từ Google Fonts. Hệ thống sẽ tự động tải font khi độc giả truy cập.</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Advanced / Security */}
          <section className="bg-card border border-border/50 rounded-[3rem] p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="font-black uppercase tracking-[0.2em] text-xs">Cấu hình bảo mật</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[2rem] border border-border/30">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Chế độ Canvas</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Bảo vệ nội dung khỏi sao chép.</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, enable_canvas: !settings.enable_canvas})}
                  className={`w-14 h-8 rounded-full transition-all flex items-center px-1.5 ${settings.enable_canvas ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-lg" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
