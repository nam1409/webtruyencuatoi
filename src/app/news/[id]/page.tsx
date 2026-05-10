import { getNewsById } from "@/actions/news";
import { getSiteSettings } from "@/actions/settings";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, User, ChevronLeft, Share2, Bookmark, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const [news, settings] = await Promise.all([
    getNewsById(id),
    getSiteSettings()
  ]);

  if (!news) {
    notFound();
  }

  const primaryColor = settings?.primary_color || "#8b5cf6";

  return (
    <div className="min-h-screen bg-background pb-24" style={{ "--primary": primaryColor } as any}>
      <Navbar user={user} settings={settings} />

      <main className="container mx-auto px-4 pt-12">
        {/* Back Button */}
        <Link 
          href="/news" 
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-12 group"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Quay lại tin tức
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="space-y-6 mb-12 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20 flex items-center gap-2">
                <Sparkles className="w-3 h-3 fill-current" />
                {news.category || "Thông báo"}
              </span>
              {news.is_pinned && (
                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-500/20">
                  Ghim
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">
              {news.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-muted-foreground/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border shadow-sm">
                  {news.profiles?.avatar_url ? (
                    <img src={news.profiles.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase bg-primary/5 text-primary">
                      {news.profiles?.display_name?.[0] || "A"}
                    </div>
                  )}
                </div>
                <span>{news.profiles?.display_name || "Admin"}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full hidden sm:block" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-60" />
                {format(new Date(news.created_at), "dd MMMM, yyyy", { locale: vi })}
              </div>
              <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full hidden sm:block" />
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 opacity-60" />
                0 bình luận
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative">
             {/* Floating Actions Sidebar - Desktop only */}
             <div className="absolute -left-24 top-0 hidden xl:flex flex-col gap-4">
                <button className="w-12 h-12 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center group" title="Chia sẻ">
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center group" title="Lưu tin">
                  <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             <div className="bg-background border border-border/50 rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-primary/5 min-h-[500px]">
                <div 
                  className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:font-medium prose-p:leading-relaxed prose-p:text-foreground/90 prose-strong:text-primary"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
             </div>
          </div>

          {/* Footer News Section */}
          <div className="mt-16 p-8 bg-muted/20 rounded-[2.5rem] border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                 <Sparkles className="w-6 h-6" />
               </div>
               <div>
                 <p className="font-black tracking-tight">Cảm ơn bạn đã theo dõi tin tức!</p>
                 <p className="text-sm text-muted-foreground font-medium">Đừng quên tham gia cộng đồng để trao đổi thêm.</p>
               </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
                Chia sẻ ngay
              </button>
              <button className="bg-background border border-border px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted/50 transition-all">
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
