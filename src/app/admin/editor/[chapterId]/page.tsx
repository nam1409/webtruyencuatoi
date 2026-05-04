"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, Send, Eye, MoreVertical } from "lucide-react";
import Link from "next/link";

import { toast } from "sonner";
import { useAutoSave } from "@/features/editor/hooks/useAutoSave";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";

export default function EditorPage() {
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState("Chương 1: Thiếu niên rèn sắt");

  const handleSave = useCallback(async (newContent: any) => {
    // This will call the Server Action later
    console.log("Saving to Supabase...", newContent);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Đã lưu bản nháp tự động");
  }, []);

  const { isSaving } = useAutoSave(content, handleSave);

  return (
    <div className="min-h-screen bg-accent/30">
      {/* Editor Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-muted rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
              Tiên Nghịch / Tập 1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
              <Eye className="w-4 h-4" />
              Xem trước
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm">
              <Send className="w-4 h-4" />
              Xuất bản
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề chương..."
            className="w-full bg-transparent text-3xl sm:text-4xl font-bold focus:outline-none placeholder:opacity-30"
          />
        </div>

        <TiptapEditor 
          initialContent={content} 
          onChange={setContent} 
          isSaving={isSaving} 
        />

        <div className="mt-8 text-sm text-muted-foreground text-center">
          Mẹo: Dùng phím tắt <kbd className="px-2 py-1 bg-muted rounded border border-border">Ctrl+B</kbd> để in đậm, <kbd className="px-2 py-1 bg-muted rounded border border-border">Ctrl+I</kbd> để in nghiêng.
        </div>
      </main>
    </div>
  );
}
