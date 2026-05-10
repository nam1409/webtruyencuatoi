"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateMultipleSiteSettings } from "@/actions/settings";
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
  Palette,
  Sparkles,
  LayoutDashboard,
  Eye,
  Lock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
      await updateMultipleSiteSettings(settings);
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
    <div className="py-12 px-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/50 p-8 rounded-[2.5rem] border border-border/40 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Zen Design System</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Giao diện Website</h1>
          <p className="text-muted-foreground font-medium text-lg italic">Cá nhân hóa phong cách hiển thị và thương hiệu.</p>
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

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 w-full md:w-auto grid grid-cols-3 gap-2 border border-border/40">
          <TabsTrigger value="general" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Chung
          </TabsTrigger>
          <TabsTrigger value="reader" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            <Eye className="w-4 h-4 mr-2" /> Reader
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            <Lock className="w-4 h-4 mr-2" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 outline-none">
          <Card className="rounded-[3rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="flex items-center gap-3 text-primary text-xs uppercase tracking-[0.2em] font-black">
                <Palette className="w-5 h-5" /> Thương hiệu & Phong cách
              </CardTitle>
              <CardDescription className="text-sm font-medium italic mt-2">Cấu hình các yếu tố nhận diện cốt lõi của website.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Khẩu hiệu / Badge (Hero Badge)</Label>
                <Input 
                  value={settings.site_description}
                  onChange={e => setSettings({...settings, site_description: e.target.value})}
                  className="rounded-2xl bg-muted/30 border-none font-bold h-14 text-lg px-6"
                  placeholder="Ví dụ: PHIÊN BẢN ELITE 2026 ĐÃ SẴN SÀNG"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Màu sắc chủ đạo (Primary)</Label>
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
                      className="flex-1 rounded-2xl bg-muted/30 border-none font-mono font-bold h-14 px-6 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Theme mặc định</Label>
                  <select 
                    value={settings.default_theme}
                    onChange={e => setSettings({...settings, default_theme: e.target.value})}
                    className="w-full h-14 bg-muted/30 border-none rounded-2xl px-6 font-bold appearance-none outline-none cursor-pointer hover:bg-muted/50 transition-all"
                  >
                    <option value="light">Sáng (Light)</option>
                    <option value="dark">Tối (Dark)</option>
                    <option value="oled">OLED (Black)</option>
                    <option value="sepia">Sepia (Cổ điển)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Type className="w-3 h-3 text-primary" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google Font (Tên font)</Label>
                  </div>
                  <Input 
                    value={settings.google_font || ""}
                    onChange={e => setSettings({...settings, google_font: e.target.value})}
                    className="rounded-2xl bg-muted/30 border-none font-bold h-14 px-6"
                    placeholder="Ví dụ: Outfit, Inter..."
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Font chữ hệ thống (Fallback)</Label>
                  <select 
                    value={settings.primary_font || "font-serif"}
                    onChange={e => setSettings({...settings, primary_font: e.target.value})}
                    className="w-full h-14 bg-muted/30 border-none rounded-2xl px-6 font-bold appearance-none outline-none cursor-pointer hover:bg-muted/50 transition-all"
                  >
                    <option value="font-serif">Serif (Có chân)</option>
                    <option value="font-sans">Sans-serif (Không chân)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reader" className="space-y-10 outline-none">
          <Card className="rounded-[3rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="flex items-center gap-3 text-primary text-xs uppercase tracking-[0.2em] font-black">
                <SettingsIcon className="w-5 h-5" /> Tùy chỉnh Reader chuyên sâu
              </CardTitle>
              <CardDescription className="text-sm font-medium italic mt-2">Quản lý phông chữ và giao diện tùy chọn cho độc giả.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6 space-y-12">
              {/* Custom Themes Management */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Danh sách Theme tùy chỉnh</Label>
                    <p className="text-[9px] text-muted-foreground italic px-1">Các theme này sẽ xuất hiện trong menu cài đặt của trình đọc.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest px-4"
                    onClick={() => {
                      const newThemes = [...(settings.custom_themes || []), {
                        id: `custom-${Date.now()}`,
                        name: "Theme mới",
                        bg: "#ffffff",
                        text: "#000000",
                        primary: "#8b5cf6",
                        muted: "#64748b"
                      }];
                      setSettings({...settings, custom_themes: newThemes});
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-2" /> Thêm Theme
                  </Button>
                </div>

                {/* Suggested Themes Gallery */}
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Gợi ý từ ZenBoard</h3>
                    </div>
                    <Badge variant="outline" className="bg-background/50 text-[8px] uppercase tracking-tighter px-2">20 Presets</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {[
                      { name: "Midnight", bg: "#0f172a", text: "#f8fafc", primary: "#38bdf8", muted: "#1e293b" },
                      { name: "Forest", bg: "#064e3b", text: "#ecfdf5", primary: "#34d399", muted: "#065f46" },
                      { name: "Paper", bg: "#f5f5dc", text: "#4b2c20", primary: "#8b4513", muted: "#d2b48c" },
                      { name: "Rose", bg: "#1e1b4b", text: "#fce7f3", primary: "#f472b6", muted: "#312e81" },
                      { name: "Ocean", bg: "#0c4a6e", text: "#f0f9ff", primary: "#0ea5e9", muted: "#075985" },
                      { name: "Coffee", bg: "#2d241e", text: "#f5ebe0", primary: "#d4a373", muted: "#3d3028" },
                      { name: "Sakura", bg: "#fff5f5", text: "#5c2d2d", primary: "#ff8787", muted: "#ffe3e3" },
                      { name: "Mint", bg: "#f0fff4", text: "#22543d", primary: "#48bb78", muted: "#c6f6d5" },
                      { name: "Nord", bg: "#2e3440", text: "#eceff4", primary: "#88c0d0", muted: "#3b4252" },
                      { name: "Dracula", bg: "#282a36", text: "#f8f8f2", primary: "#bd93f9", muted: "#44475a" },
                      { name: "Cyber", bg: "#000000", text: "#ffffff", primary: "#ff00ff", muted: "#1a1a1a" },
                      { name: "Lavender", bg: "#f3f0ff", text: "#4c3e99", primary: "#845ef7", muted: "#e5dbff" },
                      { name: "Slate", bg: "#1e293b", text: "#f1f5f9", primary: "#94a3b8", muted: "#334155" },
                      { name: "Emerald", bg: "#022c22", text: "#d1fae5", primary: "#10b981", muted: "#064e3b" },
                      { name: "Sunset", bg: "#450a0a", text: "#fef2f2", primary: "#f97316", muted: "#7f1d1d" },
                      { name: "Gold", bg: "#1a1a1a", text: "#fafafa", primary: "#fbbf24", muted: "#262626" },
                      { name: "Sky", bg: "#f0f9ff", text: "#075985", primary: "#0ea5e9", muted: "#e0f2fe" },
                      { name: "Crimson", bg: "#450606", text: "#fee2e2", primary: "#dc2626", muted: "#7f1d1d" },
                      { name: "Matcha", bg: "#f7fee7", text: "#365314", primary: "#84cc16", muted: "#ecfccb" },
                      { name: "Grape", bg: "#2e1065", text: "#f5f3ff", primary: "#a855f7", muted: "#4c1d95" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          const newThemes = [...(settings.custom_themes || []), {
                            id: `preset-${preset.name.toLowerCase()}-${Date.now()}`,
                            name: `Giao diện ${preset.name}`,
                            bg: preset.bg,
                            text: preset.text,
                            primary: preset.primary,
                            muted: preset.muted
                          }];
                          setSettings({...settings, custom_themes: newThemes});
                          toast.success(`Đã thêm theme ${preset.name}!`);
                        }}
                        className="group relative overflow-hidden rounded-[1.5rem] border border-border/40 hover:border-primary/50 transition-all p-3 text-left h-32 flex flex-col justify-between hover:scale-[1.03] active:scale-95 shadow-sm"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[8px] font-black uppercase tracking-tighter mb-1" style={{ color: preset.text }}>{preset.name}</span>
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: preset.bg }} title="Nền" />
                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: preset.text }} title="Chữ" />
                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: preset.primary }} title="Nhấn" />
                            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: preset.muted }} title="Phụ" />
                          </div>
                        </div>
                        <div className="space-y-1.5 pb-1">
                          <div className="w-full h-1.5 rounded-full opacity-40" style={{ backgroundColor: preset.text }} />
                          <div className="w-2/3 h-1.5 rounded-full opacity-20" style={{ backgroundColor: preset.text }} />
                        </div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settings.custom_themes?.map((theme, idx) => (
                    <Card key={theme.id} className="p-6 bg-muted/20 border-border/40 rounded-[2rem] space-y-6 hover:border-primary/30 transition-all shadow-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Input 
                            value={theme.name}
                            onChange={e => {
                              const updated = [...settings.custom_themes];
                              updated[idx].name = e.target.value;
                              setSettings({...settings, custom_themes: updated});
                            }}
                            className="bg-background/50 border-none font-bold text-sm h-10 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 w-full md:w-48 shadow-sm"
                          />
                          <div className="flex gap-1.5 hidden sm:flex">
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.bg }} />
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.text }} />
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.primary }} />
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: theme.muted }} />
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const updated = settings.custom_themes.filter((_, i) => i !== idx);
                            setSettings({...settings, custom_themes: updated});
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Màu nền</Label>
                          <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/20 shadow-sm">
                            <input type="color" value={theme.bg} onChange={e => {
                               const updated = [...settings.custom_themes];
                               updated[idx].bg = e.target.value;
                               setSettings({...settings, custom_themes: updated});
                            }} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                            <span className="text-[11px] font-mono font-bold">{theme.bg}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Màu chữ</Label>
                          <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/20 shadow-sm">
                            <input type="color" value={theme.text} onChange={e => {
                               const updated = [...settings.custom_themes];
                               updated[idx].text = e.target.value;
                               setSettings({...settings, custom_themes: updated});
                            }} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                            <span className="text-[11px] font-mono font-bold">{theme.text}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-primary/50 px-1">Màu nhấn (Primary)</Label>
                          <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/20 shadow-sm">
                            <input type="color" value={theme.primary || "#8b5cf6"} onChange={e => {
                               const updated = [...settings.custom_themes];
                               updated[idx].primary = e.target.value;
                               setSettings({...settings, custom_themes: updated});
                            }} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                            <span className="text-[11px] font-mono font-bold">{theme.primary || "#8b5cf6"}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Màu phụ (Muted)</Label>
                          <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border/20 shadow-sm">
                            <input type="color" value={theme.muted || "#64748b"} onChange={e => {
                               const updated = [...settings.custom_themes];
                               updated[idx].muted = e.target.value;
                               setSettings({...settings, custom_themes: updated});
                            }} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                            <span className="text-[11px] font-mono font-bold">{theme.muted || "#64748b"}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
                  
              <Separator className="opacity-30" />

              {/* Custom Fonts Management */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Danh sách Font tùy chỉnh</Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest px-4"
                    onClick={() => {
                      const newFonts = [...(settings.custom_fonts || []), {
                        id: `font-${Date.now()}`,
                        name: "Font mới",
                        fontFamily: "Inter"
                      }];
                      setSettings({...settings, custom_fonts: newFonts});
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-2" /> Thêm Font
                  </Button>
                </div>

                {/* Suggested Fonts Gallery */}
                <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Phông chữ đề xuất</h3>
                    </div>
                    <Badge variant="outline" className="bg-background/50 text-[8px] uppercase tracking-tighter px-2">Top 10 Readability</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { name: "Lora", family: "Lora", type: "Serif" },
                      { name: "Merriweather", family: "Merriweather", type: "Serif" },
                      { name: "Playfair", family: "Playfair Display", type: "Serif" },
                      { name: "Outfit", family: "Outfit", type: "Sans" },
                      { name: "Inter", family: "Inter", type: "Sans" },
                      { name: "Roboto Mono", family: "Roboto Mono", type: "Mono" },
                      { name: "Saira", family: "Saira Condensed", type: "Sans" },
                      { name: "Quicksand", family: "Quicksand", type: "Soft" },
                      { name: "Garamond", family: "EB Garamond", type: "Classic" },
                      { name: "Nunito", family: "Nunito", type: "Soft" },
                    ].map((f) => (
                      <button
                        key={f.family}
                        onClick={() => {
                          const newFonts = [...(settings.custom_fonts || []), {
                            id: `preset-font-${f.family.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                            name: `Font ${f.name}`,
                            fontFamily: f.family
                          }];
                          setSettings({...settings, custom_fonts: newFonts});
                          toast.success(`Đã thêm font ${f.name}!`);
                        }}
                        className="group flex flex-col items-center justify-center p-4 bg-background rounded-2xl border border-border/40 hover:border-primary/50 hover:scale-105 transition-all shadow-sm gap-2"
                      >
                        <span className="text-xl font-medium" style={{ fontFamily: `'${f.family}', serif` }}>Aa</span>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-tighter truncate w-full">{f.name}</p>
                          <p className="text-[7px] text-muted-foreground uppercase tracking-[0.2em]">{f.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settings.custom_fonts?.map((font, idx) => (
                    <Card key={font.id} className="p-8 bg-muted/20 rounded-[2.5rem] border-border/40 flex flex-col gap-6 shadow-none">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Tên hiển thị (Ví dụ: Font Hiện Đại)</Label>
                          <Input 
                            value={font.name}
                            onChange={e => {
                              const updated = [...settings.custom_fonts];
                              updated[idx].name = e.target.value;
                              setSettings({...settings, custom_fonts: updated});
                            }}
                            className="bg-background/50 border-none font-bold text-sm h-12 px-6 rounded-[1.2rem] focus-visible:ring-1 focus-visible:ring-primary/30 shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Tên Google Font (Ví dụ: Roboto)</Label>
                          <Input 
                            value={font.fontFamily}
                            onChange={e => {
                              const updated = [...settings.custom_fonts];
                              updated[idx].fontFamily = e.target.value;
                              setSettings({...settings, custom_fonts: updated});
                            }}
                            className="bg-muted/40 border-none font-mono text-[11px] h-12 px-6 rounded-[1.2rem]"
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
                        className="text-destructive hover:bg-destructive/10 rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 w-fit self-end"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa phông chữ
                      </Button>
                    </Card>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/60 italic px-1">* Nhập chính xác tên font từ Google Fonts. Hệ thống sẽ tự động tải font khi độc giả truy cập.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="outline-none">
          <Card className="rounded-[3rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="flex items-center gap-3 text-primary text-xs uppercase tracking-[0.2em] font-black">
                <ShieldCheck className="w-5 h-5" /> Cấu hình bảo mật
              </CardTitle>
              <CardDescription className="text-sm font-medium italic mt-2">Các thiết lập bảo vệ nội dung và hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6 space-y-6">
              <div className="flex items-center justify-between p-8 bg-muted/20 rounded-[2.5rem] border border-border/30 hover:bg-muted/30 transition-all">
                <div className="space-y-1">
                  <h3 className="font-bold text-base">Chế độ Canvas</h3>
                  <p className="text-xs text-muted-foreground font-medium">Bảo vệ nội dung khỏi sao chép bằng cách render trên Canvas.</p>
                </div>
                <Switch 
                  checked={settings.enable_canvas}
                  onCheckedChange={(checked) => setSettings({...settings, enable_canvas: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
