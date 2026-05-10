"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Save, X } from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";

interface HintEditorDialogProps {
  initialValue: any; // Now expects JSON
  onSave: (value: any) => void;
  storyId?: string;
  trigger?: React.ReactNode;
}

export function HintEditorDialog({ initialValue, onSave, storyId, trigger }: HintEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempContent, setTempContent] = useState(initialValue);

  const handleSave = () => {
    onSave(tempContent);
    setOpen(false);
  };

  // Convert string to JSON if needed (for legacy support)
  const safeInitialContent = React.useMemo(() => {
    if (typeof initialValue === 'string') {
      try {
        return JSON.parse(initialValue);
      } catch (e) {
        // If not JSON, wrap in a paragraph
        return {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: initialValue }] }]
        };
      }
    }
    return initialValue;
  }, [initialValue]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-dashed border-primary/30 hover:border-primary transition-all">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Soạn thảo nâng cao</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[96vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-background">
        <DialogHeader className="p-12 pb-10 border-b border-border/10 bg-muted/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <DialogTitle className="text-4xl font-black tracking-tighter flex items-center gap-5">
                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                Soạn thảo gợi ý mật khẩu
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Trình soạn thảo ZenStory Pro — Sử dụng @ để nhắc nhân vật, / để dùng lệnh nhanh.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full w-14 h-14 hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="w-8 h-8" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar p-10">
          <div className="max-w-4xl mx-auto bg-background rounded-[2.5rem] shadow-2xl border border-border/40 overflow-hidden min-h-full">
            <TiptapEditor 
              initialContent={safeInitialContent}
              onChange={setTempContent}
              storyId={storyId!}
            />
          </div>
        </div>

        <DialogFooter className="p-12 border-t border-border/10 bg-muted/5 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-muted-foreground/40 italic uppercase tracking-[0.2em]">
              Sử dụng toàn bộ sức mạnh của trình soạn thảo ZenStory để tạo gợi ý độc đáo.
            </span>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl font-bold px-10 h-14 text-base">
                Hủy bỏ
              </Button>
              <Button onClick={handleSave} className="rounded-2xl font-black uppercase tracking-[0.2em] px-12 h-14 bg-primary shadow-xl shadow-primary/20 gap-3 text-base">
                <Save className="w-5 h-5" />
                Lưu gợi ý
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}