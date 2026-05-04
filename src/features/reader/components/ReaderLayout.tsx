"use client";

import { useState } from "react";
import { useReader } from "../context/ReaderContext";
import { Settings, List, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { ReaderSettings } from "./ReaderSettings";
import Link from "next/link";

interface ReaderLayoutProps {
  children: React.ReactNode;
  storyTitle: string;
  chapterTitle: string;
  prevChapter?: string;
  nextChapter?: string;
}

export function ReaderLayout({
  children,
  storyTitle,
  chapterTitle,
  prevChapter,
  nextChapter,
}: ReaderLayoutProps) {
  const { settings } = useReader();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/70 border-b border-border transition-colors">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-medium text-muted-foreground line-clamp-1 text-left">
                {storyTitle}
              </h1>
              <h2 className="text-base font-semibold line-clamp-1 text-left">
                {chapterTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <List className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 hover:bg-muted rounded-full transition-colors ${showSettings ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Settings Panel (Updated to Dialog) */}
        <ReaderSettings open={showSettings} onOpenChange={setShowSettings} />
      </header>

      {/* Main Content */}
      <main 
        className={`container max-w-3xl mx-auto px-4 py-12 sm:py-20 ${settings.font}`}
        style={{ 
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight 
        }}
      >
        <article className="prose-reader animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <header className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{chapterTitle}</h1>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-50" />
          </header>
          
          <div className="reader-content text-left">
            {children}
          </div>

          {/* Navigation Controls */}
          <nav className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-12">
            {prevChapter ? (
              <Link
                href={prevChapter}
                className="w-full sm:flex-1 flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted transition-all group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Chương trước</p>
                  <p className="font-medium line-clamp-1">Thiếu niên rèn sắt</p>
                </div>
              </Link>
            ) : <div className="flex-1" />}

            {nextChapter ? (
              <Link
                href={nextChapter}
                className="w-full sm:flex-1 flex items-center justify-between gap-3 p-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs opacity-70 uppercase font-bold tracking-wider">Chương sau</p>
                  <p className="font-medium line-clamp-1">Hằng Nhạc tuyển đệ tử</p>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : <div className="flex-1" />}
          </nav>
        </article>
      </main>

      {/* Mobile Settings Trigger */}
      {!showSettings && (
        <div className="fixed bottom-6 right-6 sm:hidden z-50">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center animate-bounce-subtle"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
