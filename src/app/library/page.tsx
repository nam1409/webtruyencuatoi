import { createClient } from "@/lib/supabase/server";
import { getUserFollowedStories } from "@/actions/follows";
import { Navbar } from "@/components/layout/Navbar";
import { getSiteSettings } from "@/actions/settings";
import Link from "next/link";
import { BookOpen, User, ArrowRight, Library as LibraryIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const [stories, settings] = await Promise.all([
    getUserFollowedStories(),
    getSiteSettings()
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} settings={settings} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-xl shadow-primary/5">
            <LibraryIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Tủ truyện của tôi</h1>
            <p className="text-muted-foreground font-medium">Nơi lưu giữ những tác phẩm bạn đang theo dõi.</p>
          </div>
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {stories.map((story: any) => (
              <Link 
                key={story.id} 
                href={`/truyen/${story.slug}`}
                className="group relative flex flex-col gap-3"
              >
                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-lg transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/20">
                  {story.cover_url ? (
                    <img 
                      src={story.cover_url} 
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <div className="w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest bg-primary/80 backdrop-blur-md px-3 py-1.5 rounded-full w-fit mb-2">
                        Tiếp tục đọc <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {story.status === 'completed' && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">
                      Full
                    </div>
                  )}
                </div>
                <div className="space-y-1 px-1">
                  <h3 className="font-black text-lg tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
                    <User className="w-3 h-3" />
                    <span>{story.profiles?.display_name || "Vô danh"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto shadow-xl">
               <BookOpen className="w-12 h-12 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Tủ truyện đang trống</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Hãy khám phá và "Theo dõi" những bộ truyện yêu thích để lưu trữ chúng tại đây nhé!</p>
            </div>
            <Link href="/truyen">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                Khám phá ngay
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
