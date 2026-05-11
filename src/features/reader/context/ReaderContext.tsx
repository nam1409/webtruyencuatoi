"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "sepia" | "oled";
type Font = "font-sans" | "font-serif";

interface ReaderSettings {
  theme: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  containerPadding: number;
  customThemes?: any[];
  customFonts?: any[];
  selectedParagraph?: string | number | null;
}

interface ReaderContextType {
  settings: ReaderSettings;
  setTheme: (theme: string) => void;
  setFont: (font: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setParagraphSpacing: (spacing: number) => void;
  setContainerPadding: (padding: number) => void;
  setSelectedParagraph: (id: string | number | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  refreshKey: number;
  refreshComments: () => void;
  comments: any[];
  setComments: React.Dispatch<React.SetStateAction<any[]>>;
  isFocused: boolean;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({
  children,
  initialSettings
}: {
  children: React.ReactNode;
  initialSettings?: any;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    let savedSettings: any = {};
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("zenstory-reader-settings");
      if (saved) {
        try {
          savedSettings = JSON.parse(saved);
        } catch (e) {
          console.error("Lỗi đọc settings:", e);
        }
      }
    }

    return {
      theme: initialSettings?.default_theme || "light",
      font: initialSettings?.primary_font || "font-serif",
      fontSize: 18,
      lineHeight: 1.6,
      paragraphSpacing: 24,
      containerPadding: 24,
      ...savedSettings,
      // Đảm bảo các danh sách này luôn được lấy từ Database mới nhất
      customThemes: initialSettings?.custom_themes || [],
      customFonts: initialSettings?.custom_fonts || [],
    };
  });

  // Đồng bộ lại khi mount để cập nhật nếu database có thay đổi
  useEffect(() => {
    const saved = localStorage.getItem("zenstory-reader-settings");
    let savedParsed: any = {};
    if (saved) {
      try {
        savedParsed = JSON.parse(saved);
      } catch (e) {}
    }

    setSettings(prev => ({
      ...prev,
      ...savedParsed,
      customThemes: initialSettings?.custom_themes || [],
      customFonts: initialSettings?.custom_fonts || [],
    }));
  }, [initialSettings]);

  // Save settings and sync with cookies
  useEffect(() => {
    localStorage.setItem("zenstory-reader-settings", JSON.stringify(settings));

    // Save theme to cookie for server-side access
    document.cookie = `zenstory-theme=${settings.theme}; path=/; max-age=31536000`;

    // Also toggle standard dark mode class for tailwind
    if (settings.theme === 'dark' || settings.theme === 'oled') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Cập nhật thẻ body để các thành phần Portal (Sidebar, Dialog) cũng đúng màu
    const body = document.body;
    body.classList.remove("theme-light", "theme-dark", "theme-sepia", "theme-oled");

    // Xóa các custom theme classes cũ
    settings.customThemes?.forEach(t => body.classList.remove(`theme-${t.id}`));

    body.classList.add(`theme-${settings.theme}`);

    // Áp dụng font family cho toàn bộ trang đọc
    if (settings.font.startsWith('font-')) {
      body.style.removeProperty('--reader-font');
    } else {
      body.style.setProperty('--reader-font', `'${settings.font}', sans-serif`);
    }

    // Áp dụng màu cho custom theme nếu cần
    const customTheme = settings.customThemes?.find(t => t.id === settings.theme);
    if (customTheme) {
      body.style.setProperty('--background', customTheme.bg);
      body.style.setProperty('--foreground', customTheme.text);
      body.style.setProperty('--primary', customTheme.primary || 'var(--primary)');
      body.style.setProperty('--primary-foreground', customTheme.text); // Thường text theme hợp với primary fg
      body.style.setProperty('--muted', customTheme.muted || customTheme.bg);
      body.style.setProperty('--muted-foreground', customTheme.text + '80'); // Tạo độ mờ 50%
      body.style.setProperty('--border', customTheme.border || customTheme.text + '20');
    } else {
      // Reset style if not custom
      body.style.removeProperty('--background');
      body.style.removeProperty('--foreground');
      body.style.removeProperty('--primary');
      body.style.removeProperty('--primary-foreground');
      body.style.removeProperty('--muted');
      body.style.removeProperty('--muted-foreground');
      body.style.removeProperty('--border');
    }

    body.style.setProperty('--reader-p-spacing', `${settings.paragraphSpacing}px`);
    body.style.setProperty('--reader-container-padding', `${settings.containerPadding}px`);
  }, [settings]);

  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      console.log("Reader Focus: ON");
    };
    const handleBlur = () => {
      setIsFocused(false);
      console.log("Reader Focus: OFF");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleBlur();
      else handleFocus();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial check
    setIsFocused(document.hasFocus());

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const setTheme = (theme: string) => setSettings((s) => ({ ...s, theme }));
  const setFont = (font: string) => setSettings((s) => ({ ...s, font }));
  const setFontSize = (fontSize: number) => setSettings((s) => ({ ...s, fontSize }));
  const setLineHeight = (lineHeight: number) => setSettings((s) => ({ ...s, lineHeight }));
  const setParagraphSpacing = (paragraphSpacing: number) => setSettings((s) => ({ ...s, paragraphSpacing }));
  const setContainerPadding = (containerPadding: number) => setSettings((s) => ({ ...s, containerPadding }));
  const setSelectedParagraph = (id: string | number | null) => setSettings((s) => ({ ...s, selectedParagraph: id }));
  const refreshComments = () => setRefreshKey(prev => prev + 1);

  return (
    <ReaderContext.Provider
      value={{
        settings, setTheme, setFont, setFontSize, setLineHeight, 
        setParagraphSpacing, setContainerPadding,
        setSelectedParagraph, sidebarOpen, setSidebarOpen,
        refreshKey, refreshComments,
        comments, setComments,
        isFocused
      }}
    >
      <div className={`theme-${settings.theme} min-h-screen flex flex-col transition-colors duration-300`}>
        {children}
      </div>
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}
