"use server";

import { getStoryById, getStoryAnalytics, getStoryReaders } from "@/actions/stories";
import { getChaptersByStory } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { CreateChapterDialog } from "../../components/CreateChapterDialog";
import { ChapterList } from "../../components/ChapterList";
import { ReaderList } from "../../components/ReaderList";
import { EditStoryDialog } from "../../components/EditStoryDialog";
import { StoryStats } from "../../components/StoryStats";
import { ExportButton } from "../../components/ExportButton";
import { CollaboratorManagement } from "../../components/CollaboratorManagement";
import { ChevronLeft, BookOpen, BarChart3, Star, Settings, Users, PenTool, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface PageProps {
  params: Promise<{ storyId: string }>;
}

export default async function StoryManagementPage({ params }: PageProps) {
  const { storyId } = await params;
  
  const story = await getStoryById(storyId);
  const chapters = await getChaptersByStory(storyId);
  const volumes = await getVolumesByStory(storyId);
  const analytics = await getStoryAnalytics(storyId);
  const readersResult = await getStoryReaders(storyId, 1, 10);

  if (!story) notFound();

  const totalViews = chapters.reduce((sum: any, c: any) => sum + (c.view_count || 0), 0);

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 pb-20">
      <div className="container max-w-[1200px] mx-auto py-12 px-4">
        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center gap-4 mb-12">
          <Link href="/admin" className="p-2.5 hover:bg-muted rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border/50" />
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <Link href="/admin" className="hover:text-primary transition-colors">Bảng điều khiển</Link>
            <span>/</span>
            <span className="text-foreground">Quản lý chương</span>
          </div>
        </div>

        {/* Story Profile Header */}
        <div className="relative mb-16 p-8 bg-background rounded-[2.5rem] shadow-xl shadow-black/[0.02] border-none overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BookOpen className="w-32 h-32" />
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-40 h-56 bg-muted rounded-[2rem] overflow-hidden shadow-lg flex-shrink-0">
              {story.cover_url ? (
                <OptimizedImage src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter text-foreground">{story.title}</h1>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed line-clamp-2 max-w-2xl">
                  {story.description || "Chưa có mô tả cho tác phẩm này."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Badge icon={<Star className="w-3 h-3" />} label={story.status === 'ongoing' ? 'Đang ra' : story.status === 'completed' ? 'Hoàn thành' : 'Tạm ngưng'} />
                <Badge icon={<BarChart3 className="w-3 h-3" />} label={`${totalViews.toLocaleString()} Lượt đọc`} />
                {story.author_name && (
                  <Badge icon={<PenTool className="w-3 h-3" />} label={`TG: ${story.author_name}`} />
                )}
                {story.translator_name && (
                  <Badge icon={<Users className="w-3 h-3" />} label={`Dịch: ${story.translator_name}`} />
                )}
                {story.source && (
                  <a href={story.source.startsWith('http') ? story.source : '#'} target="_blank" rel="noopener noreferrer">
                    <Badge icon={<LinkIcon className="w-3 h-3" />} label="Nguồn" />
                  </a>
                )}
                <div className="h-4 w-px bg-border/50 mx-1" />
                <ExportButton storyId={storyId} storyTitle={story.title} />
                <Link href={`/admin/stories/${storyId}/settings`}>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-muted-foreground hover:text-primary">
                    <Settings className="w-4 h-4" /> Cài đặt truyện
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <CreateChapterDialog storyId={storyId} />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <StoryStats analytics={analytics} totalViews={totalViews} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Chapters Section */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="chapters" className="w-full">
              <div className="flex items-center justify-between mb-8 px-1">
                <TabsList className="bg-transparent p-0 h-auto gap-8 border-b border-border/40 rounded-none w-full justify-start pb-0">
                  <TabsTrigger value="chapters" className="rounded-none px-0 py-4 font-black text-[11px] uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100">
                    Mục lục bản thảo
                  </TabsTrigger>
                  <TabsTrigger value="readers" className="rounded-none px-0 py-4 font-black text-[11px] uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all shadow-none opacity-40 data-[state=active]:opacity-100">
                    Danh sách độc giả
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chapters" className="space-y-6 outline-none">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    {chapters.length} Chương đã tạo
                  </span>
                </div>
                <ChapterList chapters={chapters} storyId={storyId} volumes={volumes} />
              </TabsContent>

              <TabsContent value="readers" className="outline-none">
                <div className="flex items-center justify-between mb-8 px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    {readersResult.totalCount} Độc giả đã đăng nhập
                  </span>
                </div>
                <ReaderList initialReaders={readersResult.readers} totalCount={readersResult.totalCount} storyId={storyId} isPrivate={story.is_private} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Collaborators Section */}
          <div className="space-y-6">
            <CollaboratorManagement storyId={storyId} />
            
            <section className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Vai trò cộng tác
              </h3>
              <ul className="space-y-3">
                <li className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  <strong className="text-primary uppercase tracking-widest">Admin:</strong> Toàn quyền quản lý truyện và chương.
                </li>
                <li className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  <strong className="text-primary uppercase tracking-widest">Editor:</strong> Quyền chỉnh sửa nội dung bản thảo.
                </li>
                <li className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  <strong className="text-primary uppercase tracking-widest">Moderator:</strong> Quản lý bình luận và báo cáo.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
      {icon}
      {label}
    </div>
  );
}
