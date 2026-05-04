"use client";

import { useReader } from "../context/ReaderContext";
import { Type, Sun, Moon, Coffee, Monitor, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export function ReaderSettings({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { settings, setTheme, setFontSize, setFont } = useReader();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Cài đặt đọc truyện</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Theme Selection */}
          <section>
            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Chế độ màu</p>
            <div className="grid grid-cols-4 gap-3">
              {(["light", "dark", "sepia", "oled"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`group relative h-14 rounded-xl border-2 transition-all flex items-center justify-center ${
                    settings.theme === t 
                      ? "border-primary bg-primary/5 scale-105 shadow-md" 
                      : "border-transparent bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  {t === "light" && <Sun className="w-6 h-6 text-yellow-600" />}
                  {t === "dark" && <Moon className="w-6 h-6 text-blue-400" />}
                  {t === "sepia" && <Coffee className="w-6 h-6 text-amber-700" />}
                  {t === "oled" && <Monitor className="w-6 h-6 text-foreground" />}
                  <span className="absolute -bottom-6 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">{t}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Font Selection */}
          <section>
            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Phông chữ</p>
            <Tabs value={settings.font} onValueChange={(v) => setFont(v as any)}>
              <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
                <TabsTrigger value="font-sans" className="rounded-lg font-sans">Không chân</TabsTrigger>
                <TabsTrigger value="font-serif" className="rounded-lg font-serif">Có chân</TabsTrigger>
              </TabsList>
            </Tabs>
          </section>

          {/* Font Size */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kích thước</p>
              <span className="text-lg font-black text-primary">{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setFontSize(Math.max(12, settings.fontSize - 1))}
                className="flex-1 h-12 bg-muted/50 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Type className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setFontSize(Math.min(32, settings.fontSize + 1))}
                className="flex-1 h-12 bg-muted/50 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Type className="w-7 h-7" />
              </button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
