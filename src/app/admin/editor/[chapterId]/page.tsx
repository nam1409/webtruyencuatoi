"use client";

import { useState, useCallback, useEffect, use } from "react";
import { ChevronLeft, Send, Eye, MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { useAutoSave } from "@/features/editor/hooks/useAutoSave";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { VersionHistory } from "@/features/editor/components/VersionHistory";
import { EditorSettings } from "@/features/editor/components/EditorSettings";
import { getChapter, updateChapter, publishChapter } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  params: Promise<{ chapterId: string }>;
}

export default function EditorPage({ params }: PageProps) {
  const { chapterId } = use(params);
  const router = useRouter();
  
  const [content, setContent] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function loadChapter() {
      try {
        const data = await getChapter(chapterId);
        if (data) {
          setChapter(data);
          setTitle(data.title);
          setContent(data.content_draft || data.content_json);
          
          // Fetch volumes for this story
          const vols = await getVolumesByStory(data.story_id);
          setVolumes(vols);
        } else {
          toast.error("Không tìm thấy chương");
          router.push("/admin");
        }
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    }
    loadChapter();
  }, [chapterId, router]);

  const handleSave = useCallback(async (newContent: any) => {
    if (!newContent) return;
    
    // Ép kiểu về POJO thuần túy để tránh bị Next.js Server Action lọc mất attrs
    const cleanContent = JSON.parse(JSON.stringify(newContent));
    
    // console.log("Client: Sending (Cleaned):", JSON.stringify(cleanContent).substring(0, 500)); 
    try {
      await updateChapter(chapterId, { content_draft: cleanContent });
    } catch (error) {
      toast.error("Không thể lưu tự động");
      console.error(error);
    }
  }, [chapterId]);

  const handlePublish = async () => {
    try {
      await publishChapter(chapterId);
      toast.success("Đã xuất bản chương thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất bản");
    }
  };

  const handleRollback = (newContent: any) => {
    setContent(newContent);
    // Force editor to reload content is handled in TiptapEditor's useEffect
  };

  const { isSaving } = useAutoSave(content, handleSave);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Đang tải bản thảo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary/20">
      {/* Editor Header */}
      <header className="sticky bg-background/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/admin/stories/${chapter.story_id}`} className="group p-2.5 bg-background border border-border/40 rounded-2xl hover:bg-primary hover:border-primary transition-all duration-500 shadow-sm">
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Đang biên tập</span>
                <span className="text-sm font-black text-foreground truncate max-w-[300px]">
                  {title || "Chương mới"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-6 px-4 py-2 bg-muted/20 rounded-xl border border-border/20">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Đang tự động lưu...</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Đã lưu bản thảo</span>
                </>
              )}
            </div>
            
            <button className="flex items-center gap-2 px-6 py-2.5 bg-background text-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-border/40 hover:bg-muted/30 transition-all shadow-sm">
              <Eye className="w-4 h-4" />
              Xem trước
            </button>
            
            <button 
              onClick={handlePublish}
              className="px-8 py-2.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:shadow-xl hover:shadow-primary/30 transition-all duration-500 shadow-lg"
            >
              Xuất bản
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto bg-background dark:bg-zinc-950 custom-scrollbar scroll-smooth">
          <div className="max-w-[1000px] mx-auto py-16 px-6">
            <div className="bg-background dark:bg-zinc-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] rounded-[2.5rem] min-h-[1200px] flex flex-col overflow-hidden border border-border/40">
              {/* Internal Title Input */}
              <div className="px-16 pt-20 pb-4">
                <textarea
                  rows={1}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => updateChapter(chapterId, { title })}
                  placeholder="Thêm tiêu đề chương..."
                  className="w-full bg-transparent text-4xl sm:text-5xl font-black tracking-tight focus:outline-none placeholder:text-muted-foreground/10 resize-none leading-tight"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>

              <div className="flex-1">
                <TiptapEditor 
                  initialContent={content} 
                  onChange={setContent} 
                  isSaving={isSaving} 
                  storyId={chapter.story_id}
                />
              </div>
            </div>

            <div className="h-20" /> {/* Bottom spacing */}
          </div>
        </main>

        {/* Sidebar Panel */}
        <aside className="hidden lg:flex w-80 flex-col bg-background border-l border-border/50 overflow-hidden">
          <Tabs defaultValue="history" className="flex-1 flex flex-col">
            <div className="px-4 pt-4 border-b border-border/30 bg-muted/20">
              <TabsList className="grid grid-cols-2 w-full p-1 bg-muted/50 rounded-2xl h-11">
                <TabsTrigger value="history" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Lịch sử
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Cài đặt
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <TabsContent value="history" className="m-0 mt-2">
                <VersionHistory chapterId={chapterId} onRollback={handleRollback} />
              </TabsContent>
              <TabsContent value="settings" className="m-0 mt-2">
                <EditorSettings chapter={chapter} volumes={volumes} onUpdate={async (updated) => setChapter(updated)} />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}