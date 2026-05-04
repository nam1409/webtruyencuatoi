"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "sepia" | "oled";
type Font = "font-sans" | "font-serif";

interface ReaderSettings {
  theme: Theme;
  font: Font;
  fontSize: number;
  lineHeight: number;
}

interface ReaderContextType {
  settings: ReaderSettings;
  setTheme: (theme: Theme) => void;
  setFont: (font: Font) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: "light",
    font: "font-serif",
    fontSize: 18,
    lineHeight: 1.6,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("zenstory-reader-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("zenstory-reader-settings", JSON.stringify(settings));
    
    // Apply theme class to document body
    const body = document.body;
    body.classList.remove("theme-light", "theme-dark", "theme-sepia", "theme-oled");
    body.classList.add(`theme-${settings.theme}`);
  }, [settings]);

  const setTheme = (theme: Theme) => setSettings((s) => ({ ...s, theme }));
  const setFont = (font: Font) => setSettings((s) => ({ ...s, font }));
  const setFontSize = (fontSize: number) => setSettings((s) => ({ ...s, fontSize }));
  const setLineHeight = (lineHeight: number) => setSettings((s) => ({ ...s, lineHeight }));

  return (
    <ReaderContext.Provider
      value={{ settings, setTheme, setFont, setFontSize, setLineHeight }}
    >
      {children}
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
