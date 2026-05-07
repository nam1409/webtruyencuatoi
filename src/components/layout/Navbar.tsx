"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface NavbarProps {
  user: any;
  settings: any;
}

export function Navbar({ user, settings }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        isScrolled 
          ? "backdrop-blur-md bg-background/80 py-2 border-border" 
          : "bg-background py-4 border-transparent"
      )}
      style={{ "--primary": primaryColor } as any}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xs shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
            {settings?.site_name?.[0] || "Z"}
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {settings?.site_name || "ZenStory"}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/truyen" 
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary",
              pathname === "/truyen" ? "text-primary" : "text-muted-foreground/60"
            )}
          >
            Khám phá
          </Link>
          <Link 
            href="#" 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:text-primary"
          >
            Xếp hạng
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <Link href="/admin" className="hidden sm:block">
                  <Button variant="outline" className="rounded-xl border-primary/20 hover:border-primary/50 text-primary font-bold shadow-sm">
                    Bảng điều khiển
                  </Button>
                </Link>
              )}
              <Link href="/profile" className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border shadow-sm hover:border-primary transition-all group">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xs font-black uppercase">
                    {user.display_name?.[0] || user.user_metadata?.display_name?.[0] || user.email?.[0] || "U"}
                  </div>
                )}
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut()}
                className="rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-primary/5">Đăng nhập</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Bắt đầu</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
