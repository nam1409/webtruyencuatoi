"use client";

import { 
  Search, 
  Menu,
  Command,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationCenter } from "./NotificationCenter";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`h-16 md:h-24 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 transition-all duration-300 ${
      scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 h-14 md:h-20" : "bg-transparent"
    }`}>
      <div className="flex items-center gap-4 md:gap-6 flex-1">
        <button 
          className="lg:hidden p-2 md:p-3 rounded-2xl bg-muted/50 hover:bg-muted"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 md:w-6 h-6" />
        </button>
        
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-muted/30 rounded-[1.5rem] border border-border/20 w-full max-w-xl group focus-within:ring-4 ring-primary/10 focus-within:bg-background transition-all duration-500">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh... (Cmd + K)" 
            className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg border border-border/50">
            <Command className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Quick Action */}
        <Link href="/admin/stories/new" className="hidden xl:block">
          <Button className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Viết mới
          </Button>
        </Link>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile Quick View */}
        <div className="flex items-center gap-2 md:gap-3 md:pl-6 md:border-l border-border/50 cursor-pointer group">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Admin Hub</span>
            <span className="text-xs font-black tracking-tight">Quản trị viên</span>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-base md:text-lg group-hover:scale-105 transition-transform">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
