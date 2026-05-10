"use client";

import { useReader } from "../context/ReaderContext";
import { 
  Type, 
  Sun, 
  Moon, 
  Coffee, 
  Monitor, 
  Maximize2, 
  Menu, 
  Check, 
  CloudOff,
  Palette,
  Minus,
  Plus,
  AlignJustify
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ReaderSettings({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { 
    settings, setTheme, setFontSize, setFont, 
    setLineHeight, setParagraphSpacing, setContainerPadding 
  } = useReader();

  const isThemeActive = (themeId: string) => settings.theme === themeId;
  const isFontActive = (fontFamily: string) => settings.font === fontFamily;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <AlignJustify className="w-5 h-5" />
            </div>
            Cài đặt đọc truyện
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-8 pb-10 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-none">
          {/* Theme Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chế độ hiển thị</Label>
              <Palette className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: "light", icon: Sun, color: "text-yellow-500", name: "Sáng" },
                { id: "dark", icon: Moon, color: "text-blue-400", name: "Tối" },
                { id: "sepia", icon: Coffee, color: "text-amber-600", name: "Giấy" },
                { id: "oled", icon: Monitor, color: "text-foreground", name: "OLED" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    isThemeActive(t.id) 
                      ? "border-primary bg-primary/5 scale-105 shadow-sm" 
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${t.color}`} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{t.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Themes Row */}
            {settings.customThemes && settings.customThemes.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {settings.customThemes.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`group relative w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                      isThemeActive(t.id) 
                        ? "border-primary scale-110 shadow-lg" 
                        : "border-transparent bg-muted/30 hover:scale-105"
                    }`}
                    style={{ backgroundColor: t.bg }}
                    title={t.name}
                  >
                    <div className="grid grid-cols-2 gap-0.5 rotate-45 scale-125">
                      <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: t.bg }} />
                      <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: t.text }} />
                      <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: t.primary }} />
                      <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: t.muted }} />
                    </div>
                    {isThemeActive(t.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <Separator className="opacity-30" />

          {/* Font Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phông chữ</Label>
              <Type className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "font-sans", name: "Không chân", className: "font-sans" },
                { id: "font-serif", name: "Có chân", className: "font-serif" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className={`relative flex items-center justify-center h-12 px-4 rounded-2xl border-2 transition-all ${
                    isFontActive(f.id) 
                      ? "border-primary bg-primary/5 font-black text-primary" 
                      : "border-transparent bg-muted/30 hover:bg-muted/50 font-bold"
                  } ${f.className} text-sm`}
                >
                  {f.name}
                  {isFontActive(f.id) && <Check className="absolute right-3 w-3 h-3" />}
                </button>
              ))}
              
              {/* Custom Fonts */}
              {settings.customFonts?.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.fontFamily)}
                  className={`relative flex items-center justify-center h-12 px-4 rounded-2xl border-2 transition-all ${
                    isFontActive(f.fontFamily) 
                      ? "border-primary bg-primary/5 font-black text-primary" 
                      : "border-transparent bg-muted/30 hover:bg-muted/50 font-bold"
                  } text-sm`}
                  style={{ fontFamily: f.fontFamily }}
                >
                  {f.name}
                  {isFontActive(f.fontFamily) && <Check className="absolute right-3 w-3 h-3" />}
                </button>
              ))}
            </div>
          </section>

          {/* Precision Controls */}
          <div className="space-y-8 bg-muted/20 p-6 rounded-[2rem] border border-border/40">
            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cỡ chữ</Label>
                <Badge variant="outline" className="rounded-lg text-[10px] font-black border-primary/20 text-primary">{settings.fontSize}px</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Minus className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="range"
                  min="12"
                  max="48"
                  value={settings.fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1 accent-primary h-1 bg-muted rounded-full appearance-none cursor-pointer"
                />
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Khoảng cách dòng</Label>
                <Badge variant="outline" className="rounded-lg text-[10px] font-black border-primary/20 text-primary">{settings.lineHeight}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Menu className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1 bg-muted rounded-full appearance-none cursor-pointer"
                />
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-2">
              {/* Paragraph Spacing */}
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cách đoạn</Label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setParagraphSpacing(Math.max(0, settings.paragraphSpacing - 4))} className="w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center hover:bg-background transition-colors border border-border/40 shadow-sm"><Minus className="w-3 h-3" /></button>
                  <span className="flex-1 text-center text-xs font-black">{settings.paragraphSpacing}</span>
                  <button onClick={() => setParagraphSpacing(Math.min(100, settings.paragraphSpacing + 4))} className="w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center hover:bg-background transition-colors border border-border/40 shadow-sm"><Plus className="w-3 h-3" /></button>
                </div>
              </div>

              {/* Container Padding */}
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lề</Label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setContainerPadding(Math.max(0, settings.containerPadding - 4))} className="w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center hover:bg-background transition-colors border border-border/40 shadow-sm"><Minus className="w-3 h-3" /></button>
                  <span className="flex-1 text-center text-xs font-black">{settings.containerPadding}</span>
                  <button onClick={() => setContainerPadding(Math.min(100, settings.containerPadding + 4))} className="w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center hover:bg-background transition-colors border border-border/40 shadow-sm"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Support */}
          <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                Đọc Offline
                <Badge className="bg-green-500/20 text-[8px] text-green-600 hover:bg-green-500/30 border-none px-1.5 h-4">Active</Badge>
              </h3>
              <p className="text-[9px] text-muted-foreground font-medium italic">Tự động lưu chương vào bộ nhớ thiết bị.</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center shadow-sm">
              <Check className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
