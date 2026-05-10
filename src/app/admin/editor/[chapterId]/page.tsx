"use client";

import { useState, useCallback, useEffect, use } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, Send, Eye, MoreVertical, Loader2, Maximize, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { useAutoSave } from "@/features/editor/hooks/useAutoSave";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { VersionHistory } from "@/features/editor/components/VersionHistory";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { EditorSettings } from "@/features/editor/components/EditorSettings";
import { getChapter, updateChapter, publishChapter, updateVersionContent, getChapterVersions } from "@/actions/chapters";
import { getVolumesByStory } from "@/actions/volumes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminShell } from "@/app/admin/context/AdminShellContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Layers } from "lucide-react";

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
  const [compareContent, setCompareContent] = useState<any>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  const { setHideSidebar } = useAdminShell();

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

          // Fetch versions and select primary
          const versions = await getChapterVersions(chapterId);
          setTracks(versions);
          const primary = versions.find((v: any) => v.is_primary);
          if (primary) {
            setSelectedTrackId(primary.id);
            setContent(primary.content_draft || primary.content_json);
          }
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

  // Luôn ẩn sidebar trong editor để tối ưu không gian
  useEffect(() => {
    setHideSidebar(true);
    return () => setHideSidebar(false);
  }, [setHideSidebar]);

  const handleSave = useCallback(async (newContent: any) => {
    if (!newContent) return;
    
    // Ép kiểu về POJO thuần túy để tránh bị Next.js Server Action lọc mất attrs
    const cleanContent = JSON.parse(JSON.stringify(newContent));
    
    // console.log("Client: Sending (Cleaned):", JSON.stringify(cleanContent).substring(0, 500)); 
    try {
      if (selectedTrackId && selectedTrackId !== "original") {
        // Nếu đang chọn một luồng (Track), lưu vào luồng đó
        await updateVersionContent(selectedTrackId, cleanContent);
      } else {
        // Lưu vào draft chính của chapter (dành cho bản gốc hoặc fallback)
        await updateChapter(chapterId, { content_draft: cleanContent });
      }
    } catch (error) {
      toast.error("Không thể lưu tự động");
      console.error(error);
    }
  }, [chapterId, selectedTrackId]);

  const handlePublish = async () => {
    try {
      // Nếu là bản gốc, truyền undefined để publishChapter lấy draft từ chapters table
      const versionId = (selectedTrackId === "original") ? undefined : (selectedTrackId || undefined);
      await publishChapter(chapterId, versionId);
      toast.success("Đã xuất bản chương thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất bản");
    }
  };

  const handleRollback = (newContent: any) => {
    setContent(newContent);
    // Force editor to reload content is handled in TiptapEditor's useEffect
  };

  const handleSaveSnapshot = async (label: string) => {
    if (!selectedTrackId) return;
    try {
      const { saveVersionSnapshot } = await import("@/actions/chapters");
      await saveVersionSnapshot(selectedTrackId, content, label || undefined);
      toast.success(`Đã lưu điểm khôi phục vào hệ thống`);
      window.location.reload();
    } catch (e) {
      toast.error("Lỗi khi lưu phiên bản");
    }
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
    <div className="h-screen flex flex-col bg-background dark:bg-zinc-950 font-sans selection:bg-primary/20 overflow-hidden">
      {/* Editor Header */}
      <header className="flex-none bg-background/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-border/40 z-30">
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
            
            
            <button 
              onClick={() => setIsSplitView(!isSplitView)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border transition-all shadow-sm",
                isSplitView ? "bg-primary text-white border-primary" : "bg-background text-foreground border-border/40 hover:bg-muted/30"
              )}
            >
              <Maximize className="w-4 h-4" />
              {isSplitView ? "Đóng so sánh" : "So sánh song song"}
            </button>
            
            <button 
              onClick={() => {
                if (!selectedTrackId || selectedTrackId === "original") {
                  toast.error("Bản gốc không hỗ trợ lưu điểm khôi phục. Vui lòng tạo hoặc chọn một Luồng nội dung (Track) để dùng tính năng này.");
                  return;
                }
                setShowSnapshotDialog(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-background text-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-border/40 hover:bg-muted/30 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lưu điểm khôi phục
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
        <main className={cn(
          "flex-1 overflow-y-auto bg-background dark:bg-zinc-950 custom-scrollbar scroll-smooth transition-all duration-500",
          isSplitView ? "px-4" : ""
        )}>
          <div className={cn(
            "mx-auto py-16 px-6 transition-all duration-500",
            isSplitView ? "max-w-full" : "max-w-[1000px]"
          )}>
            <div className="flex gap-8 items-stretch h-full min-h-[calc(100vh-200px)]">
              {/* Left Column: Comparison (Only in Split View) */}
              {isSplitView && (
                <div className="flex-1 bg-muted/5 rounded-[2.5rem] border border-border/40 flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="p-6 bg-muted/20 border-b border-border/40 flex items-center justify-between h-[73px]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">So sánh với:</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[10px] font-bold hover:bg-muted/50 transition-all max-w-[200px]">
                            <span className="truncate">
                              {tracks.find(t => t.content_draft === compareContent || t.content_json === compareContent)?.name || "Chọn bản thảo..."}
                            </span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2 shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl">
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">Luồng nội dung</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {tracks.map((track) => (
                            <DropdownMenuItem 
                              key={track.id}
                              onClick={() => setCompareContent(track.content_draft || track.content_json)}
                              className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer group"
                            >
                              <div className="flex flex-col gap-0.5 w-full">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[10px]">{track.name}</span>
                                  {track.is_primary && <span className="text-[7px] font-black bg-primary/10 text-primary px-1 rounded uppercase">Primary</span>}
                                </div>
                                <span className="text-[8px] text-muted-foreground group-hover:text-primary/70">Bản nháp mới nhất</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {!compareContent && (
                      <span className="text-[10px] font-bold text-primary animate-pulse">← Chọn ở đây</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">
                    {/* Synchronized Title for Comparison */}
                    <div className="pt-20 pb-4 px-10 border-b border-border/10">
                      <h1 className="text-3xl font-black tracking-tight text-foreground/40 leading-tight">
                        {title || "Chương không tiêu đề"}
                      </h1>
                    </div>

                    {compareContent ? (
                      <TiptapEditor 
                        key={`compare-${compareContent ? 'active' : 'none'}-${selectedTrackId}`} // Force remount if track or content changes
                        initialContent={compareContent} 
                        onChange={() => {}} // Read-only in compare mode
                        storyId={chapter.story_id}
                        isReadOnly={true}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center p-20 text-center">
                        <div className="max-w-[300px]">
                          <p className="text-sm font-medium text-muted-foreground">Chọn một phiên bản từ menu bên trên để so sánh song song.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right Column: Main Editor */}
              <div className={cn(
                "bg-background dark:bg-zinc-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] rounded-[2.5rem] min-h-[1200px] flex flex-col border border-border/40 transition-all duration-500",
                isSplitView ? "flex-1" : "w-full"
              )}>
                {/* Internal Title Input */}
                <div className={cn(
                  "pt-20 pb-4 transition-all duration-500",
                  isSplitView ? "px-10" : "px-16"
                )}>
                  <textarea
                    rows={1}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => updateChapter(chapterId, { title })}
                    placeholder="Thêm tiêu đề chương..."
                    className={cn(
                      "w-full bg-transparent font-black tracking-tight focus:outline-none placeholder:text-muted-foreground/10 resize-none leading-tight",
                      isSplitView ? "text-3xl" : "text-4xl sm:text-5xl"
                    )}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </div>

                <div className="flex-1">
                  <TiptapEditor 
                    key={`main-${selectedTrackId}`} // BẮT BUỘC: Dùng key để Tiptap vẽ lại khi đổi luồng
                    initialContent={content} 
                    onChange={setContent} 
                    isSaving={isSaving} 
                    storyId={chapter.story_id}
                  />
                </div>
              </div>
            </div>

            <div className="h-20" /> {/* Bottom spacing */}
          </div>
        </main>

        {/* Sidebar Panel - Tự động ẩn khi so sánh để cân đối */}
        {!isSplitView && (
          <aside className="hidden lg:flex w-80 h-full flex-col bg-background border-l border-border/50 overflow-hidden animate-in slide-in-from-right duration-500">
            <Tabs defaultValue="history" className="h-full flex flex-col overflow-hidden">
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
            
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <TabsContent value="history" className="m-0 flex-1 overflow-y-auto p-4 custom-scrollbar outline-none">
                <VersionHistory 
                  chapterId={chapterId} 
                  onRollback={handleRollback} 
                  onCompare={(vContent) => {
                    setCompareContent(vContent);
                    setIsSplitView(true);
                  }}
                  selectedTrackId={selectedTrackId}
                  onTrackChange={setSelectedTrackId}
                />
              </TabsContent>
              <TabsContent value="settings" className="m-0 flex-1 overflow-y-auto p-4 custom-scrollbar outline-none">
                <EditorSettings chapter={chapter} volumes={volumes} onUpdate={async (updated) => setChapter(updated)} />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
        )}
      </div>

      <PromptDialog
        open={showSnapshotDialog}
        onOpenChange={setShowSnapshotDialog}
        title="Lưu điểm khôi phục"
        description="Ghi chú lại nội dung bạn vừa thay đổi để dễ dàng quay lại sau này."
        placeholder="Ví dụ: Hoàn thành phần 1, sửa lỗi chính tả..."
        defaultValue="Lưu thủ công"
        onConfirm={handleSaveSnapshot}
        label="Ghi chú lưu trữ"
      />
    </div>
  );
}