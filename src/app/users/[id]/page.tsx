import { createClient } from "@/lib/supabase/server";
import { getPublicProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, MapPin, MessageSquare, Share2, Users, Edit3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isOwner = currentUser?.id === params.id;
  
  const user = await getPublicProfile(params.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Section */}
      <div className="h-64 md:h-80 w-full relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background"
          style={{ 
            backgroundImage: user.banner_url ? `url(${user.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Info Card */}
          <div className="w-full md:w-80 space-y-6">
            <Card className="p-6 border-primary/10 bg-background/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="text-4xl font-black">{user.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-6 space-y-1">
                  <h1 className="text-2xl font-black tracking-tighter">{user.display_name}</h1>
                  <p className="text-sm text-muted-foreground font-medium">@{user.username || 'user_' + user.id.slice(0, 5)}</p>
                </div>

                <div className="flex items-center gap-4 mt-6 w-full">
                  <div className="flex-1 p-3 bg-primary/5 rounded-2xl border border-primary/5">
                    <div className="text-xl font-black">{user.followersCount}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Theo dõi</div>
                  </div>
                  <div className="flex-1 p-3 bg-primary/5 rounded-2xl border border-primary/5">
                    <div className="text-xl font-black">{user.stories.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Truyện</div>
                  </div>
                </div>

                <div className="w-full mt-6 space-y-2">
                  {isOwner ? (
                    <Link href="/admin/settings" className="w-full">
                      <Button className="w-full rounded-2xl font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 border-0">
                        <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa hồ sơ
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full rounded-2xl font-bold shadow-lg shadow-primary/20">Theo dõi</Button>
                  )}
                  <Button variant="outline" className="w-full rounded-2xl border-primary/10 font-bold">
                    <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
                  </Button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-primary/5 space-y-4">
                {user.location && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <MapPin className="w-4 h-4 text-primary" /> {user.location}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <Calendar className="w-4 h-4 text-primary" /> Tham gia {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Content */}
          <div className="flex-1 space-y-8">
            {/* Bio Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <div className="w-2 h-8 bg-primary rounded-full" />
                VỀ TÔI
              </h2>
              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <MessageSquare className="w-32 h-32" />
                </div>
                <p className="text-lg font-medium leading-relaxed italic text-foreground/80 relative z-10">
                  {user.bio || "Người dùng này chưa có tiểu sử. Nhưng chắc chắn họ là một phần quan trọng của cộng đồng ZenStory!"}
                </p>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="stories" className="w-full">
              <TabsList className="bg-transparent border-b border-primary/10 w-full justify-start gap-8 h-12 rounded-none p-0 mb-8">
                <TabsTrigger 
                  value="stories" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-black uppercase text-[10px] tracking-widest"
                >
                  Tác phẩm ({user.stories.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="feed" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-black uppercase text-[10px] tracking-widest"
                >
                  Bảng tin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stories" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {user.stories.map((story: any) => (
                    <Link href={`/truyen/${story.slug}`} key={story.id}>
                      <Card className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all rounded-[2rem]">
                        <div className="flex gap-4 p-4">
                          <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                            <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 py-1">
                            <h3 className="font-black tracking-tight leading-tight group-hover:text-primary transition-colors">{story.title}</h3>
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                                <BookOpen className="w-3 h-3" /> {story.views_count_total} lượt đọc
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {story.categories?.slice(0, 2).map((cat: any) => (
                                <span key={cat.name} className="px-2 py-0.5 bg-primary/5 rounded-md text-[8px] font-black uppercase tracking-tighter text-primary">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                  {user.stories.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground font-medium italic">
                      Tác giả chưa có tác phẩm công khai nào.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="feed" className="mt-0 space-y-4">
                {user.activities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-primary/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: vi })}
                      </div>
                      {activity.details && (
                        <p className="text-sm mt-2 text-foreground/70 italic">"{activity.details}"</p>
                      )}
                    </div>
                  </div>
                ))}
                {user.activities.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground font-medium italic">
                    Chưa có hoạt động nào được ghi nhận.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
