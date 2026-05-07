"use client";

import { X, Layers, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: any[];
  volumes: any[];
  storySlug: string;
  currentChapterSlug: string;
}

export function TableOfContents({
  isOpen,
  onClose,
  chapters,
  volumes,
  storySlug,
  currentChapterSlug
}: TableOfContentsProps) {
  if (!isOpen) return null;

  // Only show published chapters to readers
  const publishedChapters = chapters.filter(c => c.status === 'published');

  const groupedChapters = volumes.map(volume => ({
    ...volume,
    chapters: publishedChapters.filter(c => c.volume_id === volume.id).sort((a, b) => a.order_index - b.order_index)
  })).sort((a, b) => a.order_index - b.order_index);

  const orphanChapters = publishedChapters.filter(c => !c.volume_id).sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-[320px] bg-background border-r border-border h-full flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Mục lục</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {groupedChapters.map((volume) => (
            <div key={volume.id} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate">
                  {volume.title}
                </span>
              </div>
              <div className="space-y-1 pl-2">
                {volume.chapters.map((chapter:any) => (
                  <ChapterLink 
                    key={chapter.id} 
                    chapter={chapter} 
                    storySlug={storySlug} 
                    isActive={chapter.slug === currentChapterSlug} 
                  />
                ))}
              </div>
            </div>
          ))}

          {orphanChapters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Chương lẻ / Phụ lục
                </span>
              </div>
              <div className="space-y-1 pl-2">
                {orphanChapters.map((chapter) => (
                  <ChapterLink 
                    key={chapter.id} 
                    chapter={chapter} 
                    storySlug={storySlug} 
                    isActive={chapter.slug === currentChapterSlug} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ChapterLink({ chapter, storySlug, isActive }: { chapter: any, storySlug: string, isActive: boolean }) {
  return (
    <Link
      href={`/truyen/${storySlug}/${chapter.slug}`}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "hover:bg-muted text-muted-foreground/80 hover:text-foreground"
      }`}
    >
      <span className="text-xs font-bold line-clamp-1">{chapter.title}</span>
      <ChevronRight className={`w-3 h-3 transition-transform ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40 group-hover:translate-x-1"}`} />
    </Link>
  );
}
