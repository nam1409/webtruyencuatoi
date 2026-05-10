import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-black tracking-tighter animate-pulse bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            ZENSTORY
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    </div>
  );
}
