"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StaticContent } from "./StaticContent";
import { useReader } from "../context/ReaderContext";

interface ChapterPasswordGateProps {
  onUnlock: (password: string) => void;
  error?: string | null;
  hint?: string | null;
  chapterId: string;
}

export function ChapterPasswordGate({ onUnlock, error, hint, chapterId }: ChapterPasswordGateProps) {
  const { settings } = useReader();
  const [password, setPassword] = useState("");

  const parsedHint = React.useMemo(() => {
    if (!hint) return null;
    if (typeof hint === 'string') {
      try {
        return JSON.parse(hint);
      } catch (e) {
        // Fallback for plain text or HTML
        return {
          type: 'doc',
          content: [{ 
            type: 'paragraph', 
            content: [{ type: 'text', text: hint.replace(/<[^>]*>/g, '') }] 
          }]
        };
      }
    }
    return hint;
  }, [hint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onUnlock(password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[400px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/5 text-center space-y-8 password-gate-container"
      >
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Nội dung bị khóa</h2>
          <p className="text-muted-foreground text-sm">
            Chương truyện này được bảo vệ bằng mật khẩu. Vui lòng nhập mã để tiếp tục đọc.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {parsedHint && (
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 text-left animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Gợi ý từ tác giả</span>
              </div>
              <div className="prose-sm max-w-none opacity-90 pointer-events-auto">
                <StaticContent 
                  content={parsedHint} 
                  showComments={false}
                  chapterId={chapterId}
                  settings={{
                    ...settings,
                    fontSize: settings.fontSize - 2 // Slightly smaller for hint
                  }} 
                />
              </div>
            </div>
          )}

          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full h-14 bg-muted/50 border-2 border-transparent focus:border-primary rounded-2xl px-6 outline-none transition-all text-center text-lg font-bold tracking-widest group-hover:bg-muted"
              autoFocus
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 text-destructive text-sm font-bold bg-destructive/10 py-3 rounded-xl"
              >
                <ShieldAlert className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            MỞ KHÓA CHƯƠNG
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
