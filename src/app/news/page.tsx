import { getNews } from "@/actions/news";
import { Navbar } from "@/components/layout/Navbar";
import { getSiteSettings } from "@/actions/settings";
import { createClient } from "@/lib/supabase/server";
import { Megaphone, Zap, Sparkles, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AllNewsPage() {
  const news = await getNews(100); // Lấy tối đa 100 tin gần nhất
  const settings = await getSiteSettings();
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Fetch full profile if logged in
  let user = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    user = profile ? { ...authUser, ...profile } : authUser;
  }

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="flex flex-col min-h-screen bg-background" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-16 text-center space-y-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại trang chủ
            </Link>
            <h1 className="text-6xl font-black tracking-tighter italic">ZenBoard<span className="text-primary">.</span></h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">
              Trung tâm thông báo, cập nhật kỹ thuật và các sự kiện cộng đồng từ ban quản trị ZenStory.
            </p>
          </div>

          {/* News Timeline */}
          <div className="space-y-8 relative">
            {/* Vertical Line Decoration */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50 hidden md:block" />

            {news.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-[3rem]">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Chưa có tin tức nào được đăng tải.</p>
              </div>
            ) : (
              news.map((item: any) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute left-6 top-8 w-3 h-3 rounded-full bg-border group-hover:bg-primary border-4 border-background -translate-x-1/2 z-10 transition-colors hidden md:block" />
                  
                  <div className="md:ml-16 bg-muted/20 hover:bg-muted/30 border border-border/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        item.category === 'Cập nhật' ? "bg-blue-500/10 text-blue-500" :
                        item.category === 'Sự kiện' ? "bg-amber-500/10 text-amber-500" :
                        "bg-primary/10 text-primary"
                      )}>
                        {item.category === 'Cập nhật' ? <Zap className="w-6 h-6" /> : 
                         item.category === 'Sự kiện' ? <Sparkles className="w-6 h-6" /> : 
                         <Megaphone className="w-6 h-6" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            item.category === 'Cập nhật' ? "bg-blue-500/10 text-blue-500" :
                            item.category === 'Sự kiện' ? "bg-amber-500/10 text-amber-500" :
                            "bg-primary/10 text-primary"
                          )}>
                            {item.category}
                          </span>
                          {item.is_pinned && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
                          <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </h2>
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border bg-accent/30 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 {settings?.site_name || "ZenStory"} Platform. News Center.</p>
        </div>
      </footer>
    </div>
  );
}
