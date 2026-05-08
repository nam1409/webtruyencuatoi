import { Sun, Moon, Coffee, Monitor, Palette } from "lucide-react";
import { useReader } from "@/features/reader/context/ReaderContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { settings, setTheme } = useReader();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-muted/50">
        <div className="w-5 h-5" />
      </Button>
    );
  }

  const themes = [
    { id: "light", name: "Sáng", icon: <Sun className="w-4 h-4 text-yellow-600" /> },
    { id: "dark", name: "Tối", icon: <Moon className="w-4 h-4 text-blue-400" /> },
    { id: "sepia", name: "Giấy cũ", icon: <Coffee className="w-4 h-4 text-amber-700" /> },
    { id: "oled", name: "Đen sâu", icon: <Monitor className="w-4 h-4 text-primary" /> },
  ];

  const currentTheme = themes.find(t => t.id === settings.theme) || { 
    id: settings.theme, 
    name: settings.customThemes?.find(t => t.id === settings.theme)?.name || "Tùy chỉnh", 
    icon: <Palette className="w-4 h-4 text-primary" /> 
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300 shadow-sm"
          title="Chọn giao diện"
        >
          <div className="animate-in zoom-in duration-300">
            {currentTheme.icon}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-[1.5rem] p-2 bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl z-[100]">
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          Chế độ hiển thị
        </div>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
              settings.theme === t.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
            )}
          >
            {t.icon}
            <span className="text-xs">{t.name}</span>
          </DropdownMenuItem>
        ))}

        {settings.customThemes && settings.customThemes.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-border/30 my-2" />
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Giao diện tùy chỉnh
            </div>
            {settings.customThemes.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                  settings.theme === t.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                )}
              >
                <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: t.bg }} />
                <span className="text-xs">{t.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
