import { createClient } from "@/lib/supabase/server";
import { getAllProgress } from "@/actions/progress";
import { Navbar } from "@/components/layout/Navbar";
import { getSiteSettings } from "@/actions/settings";
import Link from "next/link";
import { BookOpen, User, Clock, Trash2, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const [history, settings] = await Promise.all([
    getAllProgress(),
    getSiteSettings()
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} settings={settings} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-xl shadow-primary/5">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Lịch sử đọc</h1>
              <p className="text-muted-foreground font-medium">Theo dõi những hành trình bạn đã đi qua.</p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors bg-muted/50 px-4 py-2 rounded-xl">
            <Trash2 className="w-4 h-4" /> Xóa toàn bộ
          </button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((entry: any) => (
              <Link 
                key={entry.story_id} 
                href={`/truyen/${entry.stories?.slug}`}
                className="group flex flex-col md:flex-row gap-6 p-6 bg-muted/20 hover:bg-muted/40 rounded-[2.5rem] border border-border/50 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-full md:w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-muted shrink-0 shadow-md">
                  {entry.stories?.cover_url ? (
                    <OptimizedImage 
                      src={entry.stories.cover_url} 
                      alt={entry.stories.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Clock className="w-3 h-3" />
                    Đã đọc {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true, locale: vi })}
                  </div>
                  
                  <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                    {entry.stories?.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 opacity-60" />
                      {entry.stories?.profiles?.display_name || "Vô danh"}
                    </div>
                    <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    <div className="flex items-center gap-1.5 text-primary">
                      <BookOpen className="w-4 h-4 opacity-60" />
                      Đang dừng tại: {entry.chapters?.title || "Chương đầu"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center pr-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                     <ArrowRight className="w-6 h-6" />
                   </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto shadow-xl">
               <Clock className="w-12 h-12 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Chưa có lịch sử đọc</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Mọi chương truyện bạn đọc sẽ được tự động lưu lại tại đây.</p>
            </div>
            <Link href="/">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                Bắt đầu đọc ngay
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
