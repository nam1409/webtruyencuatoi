"use client";

import Link from "next/link";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogOut, Search, ChevronDown, BookOpen, Clock, Heart, User as UserIcon, Settings as SettingsIcon, Loader2, Sparkles } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchStories } from "@/actions/stories";
import { OptimizedImage } from "../ui/OptimizedImage";

interface NavbarProps {
  user: any;
  settings: any;
}

export function Navbar({ user, settings }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Cmd+K shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Check admin/collab access
    if (user) {
      import("@/actions/admin").then(({ checkAdminRole }) => {
        checkAdminRole().then(setCanAccessAdmin);
      });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStories({ query: searchQuery });
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b",
          isScrolled 
            ? "backdrop-blur-md bg-background/80 py-2 border-border shadow-sm" 
            : "bg-background py-4 border-transparent"
        )}
        style={{ "--primary": primaryColor } as any}
      >
        <div className="container mx-auto px-4 flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 group shrink-0">
            {settings?.logo_url ? (
              <OptimizedImage 
                src={settings.logo_url} 
                alt={settings.site_name || "ZenStory"} 
                className="h-16 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            ) : (
              <>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xs shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
                  {settings?.site_name?.[0] || "Z"}
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 hidden lg:block">
                  {settings?.site_name || "ZenStory"}
                </span>
              </>
            )}
          </Link>

          {/* Search Bar - Trigger */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-md relative group items-center"
          >
            <div className="absolute left-4 text-muted-foreground group-hover:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <div className="w-full h-11 bg-muted/30 border border-transparent group-hover:border-primary/20 group-hover:bg-background rounded-2xl pl-12 pr-12 text-sm font-medium text-muted-foreground/60 flex items-center transition-all cursor-text">
              Tìm kiếm truyện, tác giả...
            </div>
            <div className="absolute right-4 pointer-events-none">
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:text-primary outline-none">
                Khám phá <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl p-2 min-w-[200px] border-border/50 shadow-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Thể loại phổ biến</DropdownMenuLabel>
                <DropdownMenuItem className="rounded-xl font-bold focus:bg-primary/5 focus:text-primary cursor-pointer px-3 py-2">
                  Tiên Hiệp
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl font-bold focus:bg-primary/5 focus:text-primary cursor-pointer px-3 py-2">
                  Huyền Huyễn
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl font-bold focus:bg-primary/5 focus:text-primary cursor-pointer px-3 py-2">
                  Đam Mỹ
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <Link href="/truyen">
                  <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase tracking-tighter bg-primary/10 text-primary cursor-pointer px-3 py-2">
                    Xem tất cả truyện
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link 
              href="/ranking" 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:text-primary"
            >
              Xếp hạng
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {user ? (
              <div className="flex items-center gap-3">
                {canAccessAdmin && (
                  <Link href="/admin" className="hidden xl:block">
                    <Button variant="outline" className="rounded-xl border-primary/20 hover:border-primary/50 text-primary font-bold shadow-sm h-10 px-6">
                      Quản trị
                    </Button>
                  </Link>
                )}
                <ThemeToggle />
                <NotificationCenter />
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border shadow-sm hover:border-primary transition-all group">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" />
                      ) : user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xs font-black uppercase">
                          {user.display_name?.[0] || user.user_metadata?.display_name?.[0] || user.email?.[0] || "U"}
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-border/50 shadow-2xl">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black tracking-tight">{user.display_name || user.user_metadata?.display_name || "Người dùng Zen"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="opacity-50" />
                    <Link href="/library">
                      <DropdownMenuItem className="rounded-xl font-bold py-2.5 px-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                        <BookOpen className="w-4 h-4 mr-3 opacity-60" /> Tủ truyện của tôi
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/history">
                      <DropdownMenuItem className="rounded-xl font-bold py-2.5 px-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                        <Clock className="w-4 h-4 mr-3 opacity-60" /> Lịch sử đọc
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="rounded-xl font-bold py-2.5 px-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                      <Heart className="w-4 h-4 mr-3 opacity-60" /> Truyện đã thích
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-50" />
                    <Link href="/profile">
                      <DropdownMenuItem className="rounded-xl font-bold py-2.5 px-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                        <UserIcon className="w-4 h-4 mr-3 opacity-60" /> Hồ sơ cá nhân
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="rounded-xl font-bold py-2.5 px-3 cursor-pointer focus:bg-primary/5 focus:text-primary">
                      <SettingsIcon className="w-4 h-4 mr-3 opacity-60" /> Thiết lập tài khoản
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="rounded-xl font-bold py-2.5 px-3 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-primary/5 h-10">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all h-10">Bắt đầu</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-background rounded-[2rem]">
          <DialogHeader className="p-6 pb-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                autoFocus
                placeholder="Tìm kiếm tác phẩm, tác giả hoặc thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-muted/40 rounded-2xl pl-12 pr-6 text-lg font-bold border-none focus:ring-2 ring-primary/20 transition-all outline-none"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto p-6 pt-4 custom-scrollbar">
            {!searchQuery.trim() ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-xl tracking-tight">Khám phá thế giới ZenStory</p>
                  <p className="text-muted-foreground text-sm">Nhập từ khóa để bắt đầu tìm kiếm những câu chuyện tuyệt vời.</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">Kết quả tìm kiếm ({searchResults.length})</p>
                {searchResults.map((story) => (
                  <Link 
                    key={story.id} 
                    href={`/truyen/${story.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50"
                  >
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {story.cover_url ? (
                        <OptimizedImage alt={story.title} src={story.cover_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <h4 className="font-black text-base tracking-tight truncate group-hover:text-primary transition-colors">{story.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <UserIcon className="w-3 h-3" />
                           {story.profiles?.display_name || "Vô danh"}
                         </div>
                         <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                         <div className="flex items-center gap-1">
                           <BookOpen className="w-3 h-3" />
                           {story.chapter_count || 0} chương
                         </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 opacity-70">
                        {story.description || "Không có mô tả cho tác phẩm này."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="py-12 text-center space-y-2">
                <p className="font-bold text-lg">Không tìm thấy kết quả nào</p>
                <p className="text-muted-foreground text-sm">Thử với từ khóa khác hoặc kiểm tra lại chính tả nhé.</p>
              </div>
            ) : null}
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/30 flex items-center justify-between text-[10px] font-bold text-muted-foreground/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-background">ESC</kbd> Đóng</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-background">↑↓</kbd> Di chuyển</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border bg-background">ENTER</kbd> Xem truyện</span>
            </div>
            <p>ZenStory Search v1.0</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
