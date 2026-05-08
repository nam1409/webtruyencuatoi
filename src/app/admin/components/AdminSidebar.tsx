"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  Palette, 
  ChevronRight, 
  LogOut,
  Zap,
  Activity,
  BarChart3,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getGlobalStats } from "@/actions/admin";
import { signOut } from "@/app/auth/actions";

const menuItems = [
  {
    title: "Tổng quan",
    icon: LayoutDashboard,
    href: "/admin",
    group: "Dashboard"
  },
  {
    title: "Tác phẩm",
    icon: BookOpen,
    href: "/admin/stories",
    group: "Content"
  },
  {
    title: "Bình luận",
    icon: MessageSquare,
    href: "/admin/comments",
    group: "Content"
  },
  {
    title: "Phân tích",
    icon: BarChart3,
    href: "/admin/analytics",
    group: "Performance"
  },
  {
    title: "Bảng tin",
    icon: Megaphone,
    href: "/admin/news",
    group: "System"
  },
  {
    title: "Trang chủ",
    icon: LayoutDashboard,
    href: "/admin/homepage",
    group: "System"
  },
  {
    title: "Giao diện",
    icon: Palette,
    href: "/admin/appearance",
    group: "System"
  },
  {
    title: "Cài đặt",
    icon: Settings,
    href: "/admin/settings",
    group: "System"
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState({ stories: 0, views: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getGlobalStats().then(setStats);
    
    // Check if real admin
    const checkRole = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setIsAdmin(profile?.role === "admin");
      }
    };
    checkRole();
  }, []);

  return (
    <aside className="w-80 h-screen sticky top-0 bg-background/60 backdrop-blur-3xl border-r border-border/50 flex flex-col p-6 overflow-hidden">
      {/* Brand Section */}
      <div className="flex items-center gap-3 px-2 mb-12 group cursor-pointer">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:rotate-12 transition-transform duration-500">
          <Zap className="text-primary-foreground fill-primary-foreground w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter text-foreground leading-none">ZENSTORY</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Creative Hub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-10 overflow-y-auto no-scrollbar pr-2">
        {["Dashboard", "Content", "Performance", "System"]
          .filter(group => isAdmin || group !== "System")
          .map((group) => (
          <div key={group} className="space-y-3">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
              {group}
            </h3>
            <div className="space-y-1.5">
              {menuItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 relative",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3.5 z-10">
                        <item.icon className={cn("w-5 h-5", isActive ? "" : "text-muted-foreground/60 group-hover:text-primary")} />
                        <span className="text-sm font-black tracking-tight">{item.title}</span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-transform duration-300 z-10", isActive ? "rotate-90" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
                      
                      {isActive && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute inset-0 bg-primary rounded-[1.25rem]"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Stats Quick View */}
      <div className="mt-8 pt-8 border-t border-border/50">
        <div className="bg-muted/40 rounded-[2.25rem] p-6 space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stats Live</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tác phẩm</p>
              <p className="text-xl font-black tracking-tight">{stats.stories}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lượt đọc</p>
              <p className="text-xl font-black tracking-tight">{stats.views > 1000 ? (stats.views/1000).toFixed(1) + 'k' : stats.views}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={() => signOut()}
        className="mt-6 w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 font-bold text-sm"
      >
        <LogOut className="w-5 h-5" />
        Đăng xuất
      </button>
    </aside>
  );
}
