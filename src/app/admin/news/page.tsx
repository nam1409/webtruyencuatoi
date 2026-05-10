import { Megaphone, Plus, Trash2, Pin, Zap, Sparkles, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNews, createNews, deleteNews } from "@/actions/news";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewsForm } from "./NewsForm";

export default async function AdminNewsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Kiểm tra quyền Admin
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();
    
    if (profile?.role !== 'admin') {
      redirect("/");
    }
  } else {
    redirect("/login");
  }

  const news = await getNews(50); // Lấy 50 tin gần nhất để quản lý

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground">Quản lý Tin tức</h1>
            <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{news.length} Bài đăng</span>
            </div>
          </div>
          <p className="text-muted-foreground font-black text-sm uppercase tracking-[0.3em]">
            ZenBoard - Nơi kết nối và cập nhật thông tin tới độc giả.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Create News Button Section */}
        <div className="max-w-xs">
          <NewsForm />
        </div>

        {/* News List Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-4 mb-6">Lịch sử bài đăng</h2>
          {news.length === 0 ? (
            <div className="py-20 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Chưa có bài đăng nào.</p>
            </div>
          ) : (
            news.map((item: any) => (
              <Card key={item.id} className="group border-none shadow-xl shadow-black/[0.02] rounded-[2.5rem] bg-background/50 backdrop-blur-md overflow-hidden hover:scale-[1.01] transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {item.category === 'Cập nhật' ? <Zap className="w-6 h-6" /> : 
                       item.category === 'Sự kiện' ? <Sparkles className="w-6 h-6" /> : 
                       <Megaphone className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          item.category === 'Cập nhật' ? "bg-blue-500/10 text-blue-500" :
                          item.category === 'Sự kiện' ? "bg-amber-500/10 text-amber-500" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {item.category}
                        </span>
                        {item.is_pinned && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-destructive/10 text-destructive text-[8px] font-black rounded-md uppercase tracking-widest">
                            <Pin className="w-2.5 h-2.5" /> Ghim
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight truncate mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {item.content.replace(/<[^>]*>/g, ' ')}
                      </p>
                    </div>
                    <form action={async () => {
                      "use server";
                      await deleteNews(item.id);
                    }}>
                      <Button variant="ghost" className="w-12 h-12 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
