"use client";

import { useState, useEffect } from "react";
import { useReader } from "../context/ReaderContext";
import { Settings, List, ChevronLeft, ChevronRight, Share2, MessageSquare } from "lucide-react";
import { ReaderSettings } from "./ReaderSettings";
import { CommentSidebar } from "./CommentSidebar";
import { useContentProtection } from "../hooks/useContentProtection";
import { getCommentsByChapter } from "@/actions/comments";
import { getCharactersByStory } from "@/actions/characters";
import { CharacterTooltip } from "./CharacterTooltip";
import { TableOfContents } from "./TableOfContents";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { saveReadingProgress } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface ReaderLayoutProps {
  children: React.ReactNode;
  chapterId: string;
  storyId: string;
  storyTitle: string;
  chapterTitle: string;
  chapters?: any[];
  volumes?: any[];
  storySlug?: string;
  chapterSlug?: string;
  protectionEnabled?: boolean;
  initialScroll?: number;
  versions?: any[];
}

export function ReaderLayout({
  children,
  chapterId,
  storyId,
  storyTitle,
  chapterTitle,
  chapters = [],
  volumes = [],
  storySlug = "",
  chapterSlug = "",
  protectionEnabled = true,
  initialScroll = 0,
  versions = [],
}: ReaderLayoutProps) {
  const { settings, comments, setComments, setSelectedParagraph: setGlobalSelectedParagraph } = useReader();
  const selectedParagraph = settings.selectedParagraph as string | null;
  const setSelectedParagraph = (id: string | null) => setGlobalSelectedParagraph(id);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  const currentVersionId = searchParams.get('v') || versions.find(v => v.is_primary)?.id || 'main';

  // Only consider published chapters for public navigation
  const publishedChapters = [...chapters]
    .filter(c => c.status === 'published')
    .sort((a, b) => a.order_index - b.order_index);

  const currentIndex = publishedChapters.findIndex(c => c.id === chapterId);
  const prevChapterObj = currentIndex > 0 ? publishedChapters[currentIndex - 1] : null;
  const nextChapterObj = currentIndex < publishedChapters.length - 1 ? publishedChapters[currentIndex + 1] : null;

  const prevChapter = prevChapterObj ? `/truyen/${storySlug}/${prevChapterObj.slug}` : undefined;
  const nextChapter = nextChapterObj ? `/truyen/${storySlug}/${nextChapterObj.slug}` : undefined;

  const loadData = async () => {
    try {
      const [commentData, charData] = await Promise.all([
        getCommentsByChapter(chapterId),
        getCharactersByStory(storyId)
      ]);
      setComments([...(commentData || [])]);
      setCharacters(charData || []);
    } catch (error) {
      console.error("Error loading reader data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Khởi tạo Supabase Client
    const supabase = createBrowserClient();

    // 2. Thiết lập Realtime Subscription cho comments
    const channel = supabase
      .channel(`chapter_comments:${chapterId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'comments',
          // Tạm thời bỏ filter để debug xem có nhận được gì không
          // filter: `chapter_id=eq.${chapterId}` 
        },
        async (payload: any) => {
          const cid = payload.new?.chapter_id || payload.old?.chapter_id;
          if (cid !== chapterId) return;

          console.log("Realtime comment change:", payload);

          if (payload.eventType === 'INSERT') {
            // Hiển thị ngay lập tức bằng dữ liệu từ payload (tránh delay)
            const placeholderComment = {
              ...payload.new,
              profiles: {
                display_name: "Người dùng mới",
                avatar_url: null
              }
            };

            setComments((prev: any[]) => {
              if (prev.some(c => c.id === placeholderComment.id)) return prev;
              return [...prev, placeholderComment];
            });

            // Sau đó mới lấy thêm thông tin profile đầy đủ
            const { data: fullComment } = await supabase
              .from("comments")
              .select("*, profiles:user_id (display_name, avatar_url)")
              .eq("id", payload.new.id)
              .single();
            
            if (fullComment) {
              setComments((prev: any[]) => prev.map(c => 
                c.id === fullComment.id ? fullComment : c
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            // Khi có update (ví dụ được duyệt), chúng ta cũng cần lấy lại profile
            const { data: updatedComment } = await supabase
              .from("comments")
              .select("*, profiles:user_id (display_name, avatar_url)")
              .eq("id", payload.new.id)
              .single();

            if (updatedComment) {
              setComments((prev: any[]) => prev.map(c =>
                c.id === updatedComment.id ? updatedComment : c
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            setComments((prev: any[]) => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapterId, storyId]);

  // Handle direct comment linking from notifications
  useEffect(() => {
    if (comments.length > 0 && typeof window !== 'undefined' && window.location.hash.startsWith('#comment-')) {
      const commentId = window.location.hash.replace('#comment-', '');
      const linkedComment = comments.find(c => c.id === commentId);
      if (linkedComment) {
        // Open the sidebar for the correct paragraph
        setSelectedParagraph(linkedComment.paragraph_id || "general");

        // If it's a paragraph comment, scroll to that paragraph in the main content
        if (linkedComment.paragraph_id) {
          setTimeout(() => {
            const el = document.querySelector(`[data-paragraph-id="${linkedComment.paragraph_id}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      }
    }
  }, [comments]);

  useContentProtection(protectionEnabled);

  useEffect(() => {
    const handleParagraphClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore clicks inside the password gate
      if (target.closest('.password-gate-container')) {
        return;
      }

      // Nếu nhấn vào các phần tử tương tác đặc biệt, không mở bảng bình luận
      if (target.closest('.spoiler-text, .character-mention, .annotation-span, [data-slot="dialog-trigger"]')) {
        return;
      }

      const bubble = target.closest('.comment-bubble');
      const paragraph = target.closest('[data-paragraph-id]');

      if (bubble) {
        const id = bubble.getAttribute('data-paragraph-id');
        setSelectedParagraph(id);
        return;
      }

      if (paragraph) {
        const id = paragraph.getAttribute('data-paragraph-id');
        setSelectedParagraph(id);
      }
    };

    const handleCharacterHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mention = target.closest('.character-mention');

      if (mention) {
        const charId = mention.getAttribute('data-id');
        const character = characters.find(c => c.id === charId);
        if (character) {
          const rect = mention.getBoundingClientRect();
          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
          setActiveCharacter(character);
        }
      }
    };

    const readerContent = document.querySelector('.reader-content');
    readerContent?.addEventListener('click', handleParagraphClick as EventListener);
    readerContent?.addEventListener('mouseover', handleCharacterHover as EventListener);

    return () => {
      readerContent?.removeEventListener('click', handleParagraphClick as EventListener);
      readerContent?.removeEventListener('mouseover', handleCharacterHover as EventListener);
    };
  }, [characters]);

  // Auto-save Reading Progress
  useEffect(() => {
    let lastSavedScroll = 0;
    const saveInterval = setInterval(() => {
      const currentScroll = window.scrollY;
      if (Math.abs(currentScroll - lastSavedScroll) > 200) {
        saveReadingProgress(storyId, chapterId, Math.floor(currentScroll));
        lastSavedScroll = currentScroll;
      }
    }, 5000); // Save every 5 seconds if scrolled significantly

    return () => clearInterval(saveInterval);
  }, [chapterId, storyId]);

  // Initial Scroll Position
  useEffect(() => {
    if (initialScroll > 0) {
      const timeout = setTimeout(() => {
        window.scrollTo({
          top: initialScroll,
          behavior: 'smooth'
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [initialScroll]);

  // Track Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Remove highlight from all paragraphs first
    const allParagraphs = document.querySelectorAll('[data-paragraph-id]');
    allParagraphs.forEach(p => {
      p.classList.remove('bg-primary/5', 'border-l-4', 'border-primary', 'pl-4', 'rounded-r-xl', 'py-2', 'transition-all', 'duration-500');
    });

    // Add highlight to selected paragraph
    if (selectedParagraph && selectedParagraph !== "general") {
      const target = document.querySelector(`[data-paragraph-id="${selectedParagraph}"]`);
      if (target) {
        target.classList.add('bg-primary/5', 'border-l-4', 'border-primary', 'pl-4', 'rounded-r-xl', 'py-2', 'transition-all', 'duration-500');
        // Smooth scroll to the paragraph if needed
        // target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedParagraph]);

  useEffect(() => {
    const paragraphs = document.querySelectorAll('[data-paragraph-id]');

    paragraphs.forEach((p) => {
      const id = p.getAttribute('data-paragraph-id');
      if (!id) return;

      // Ensure string comparison to avoid type mismatch
      const paragraphComments = (comments || []).filter(c => String(c.paragraph_id) === String(id));
      const count = paragraphComments.length;

      // Always clear existing bubble to avoid duplicates
      p.querySelector('.comment-bubble')?.remove();

      if (count > 0) {
        const bubble = document.createElement('span');
        bubble.className = 'comment-bubble absolute -right-8 top-0 flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-[10px] font-black cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all shadow-sm z-10';
        bubble.setAttribute('data-paragraph-id', id!);
        bubble.innerHTML = count.toString();

        p.classList.add('relative');
        p.appendChild(bubble);
      }
    });
  }, [comments, children]);

  return (
    <div className={`flex-1 flex flex-col transition-colors duration-300 bg-background text-foreground theme-${settings.theme}`}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/70 border-b border-border transition-colors">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/truyen/${storySlug}`} className="p-2 hover:bg-muted rounded-xl transition-all">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="hidden sm:block text-left">
              <h1 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">
                {storyTitle}
              </h1>
              <h2 className="text-sm font-bold line-clamp-1">
                {chapterTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Version Switcher */}
            {versions.length > 1 && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-muted/50 border border-border rounded-xl">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground/60">Phiên bản:</span>
                <select
                  className="bg-transparent border-none outline-none text-[10px] font-bold text-primary cursor-pointer"
                  value={currentVersionId}
                  onChange={(e) => {
                    const v = e.target.value;
                    const params = new URLSearchParams(searchParams.toString());
                    if (v) params.set('v', v);
                    else params.delete('v');
                    router.push(`?${params.toString()}`);
                  }}
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.is_primary ? '(Mặc định)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowTOC(true)}
              className="p-2.5 hover:bg-muted rounded-xl transition-all"
            >
              <List className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 hover:bg-muted rounded-xl transition-all ${showSettings ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : ''}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ReaderSettings open={showSettings} onOpenChange={setShowSettings} />

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* Main Content & Sidebar Container */}
      <div className="flex-1 flex flex-row items-start justify-center relative">
        <main
          className={`flex-1 container max-w-3xl mx-auto pt-8 pb-24 sm:pt-16 ${settings.font.startsWith('font-') ? settings.font : ''} min-w-0`}
          style={{
            paddingLeft: 'var(--reader-container-padding)',
            paddingRight: 'var(--reader-container-padding)',
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            fontFamily: settings.font === 'font-serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' :
              settings.font === 'font-sans' ? 'ui-sans-serif, system-ui, sans-serif' :
                `'${settings.font}', var(--reader-font), sans-serif`
          }}
        >
          <article className="prose-reader animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <header className="mb-10 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 block">Đang đọc</span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-8 leading-tight">{chapterTitle}</h1>
              <div className="h-1 w-24 bg-primary/20 mx-auto rounded-full" />
            </header>

            <div className="reader-content text-left selection:bg-primary/20 relative overflow-hidden">
              {protectionEnabled && (
                <div
                  className="absolute inset-0 pointer-events-none select-none opacity-[0.03] dark:opacity-[0.02] z-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='30' font-weight='900' font-family='sans-serif' fill='black' text-anchor='middle' transform='rotate(-25 200 200)' style='text-transform: uppercase; letter-spacing: 0.5em;'%3EZenStory Elite%3C/text%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                  }}
                />
              )}
              <div className="relative z-10">
                {children}
              </div>
            </div>

            {/* General Chapter Comments Button */}
            <div
              onClick={() => setSelectedParagraph("general")}
              className="mt-20 p-8 rounded-[2.5rem] bg-muted/30 border border-border/50 hover:border-primary/50 cursor-pointer group transition-all animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <MessageSquare className="w-8 h-8 fill-primary/10" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black tracking-tighter mb-1">Thảo luận chương</h4>
                    <p className="text-xs text-muted-foreground font-medium italic opacity-70">Có {comments.filter(c => c.paragraph_id === null).length} bình luận tổng quát...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex -space-x-3">
                    {comments.filter(c => c.paragraph_id === null).slice(0, 3).map((c, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted overflow-hidden">
                        <img src={c.profiles?.avatar_url} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <Button className="rounded-xl font-bold group-hover:translate-x-1 transition-transform">
                    Viết cảm nhận
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <nav className="mt-32 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border pt-16">
              {prevChapter ? (
                <Link
                  href={prevChapter}
                  className="w-full sm:flex-1 flex items-center gap-4 p-6 rounded-[2rem] border border-border hover:border-primary/50 hover:bg-muted transition-all group"
                >
                  <div className="p-3 bg-muted rounded-2xl group-hover:-translate-x-1 transition-transform">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Trước đó</p>
                    <p className="font-bold text-sm line-clamp-1 italic opacity-80">{prevChapterObj?.title}</p>
                  </div>
                </Link>
              ) : <div className="flex-1" />}

              {nextChapter ? (
                <Link
                  href={nextChapter}
                  className="w-full sm:flex-1 flex items-center justify-between gap-4 p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  <div className="text-left">
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-widest mb-1">Tiếp theo</p>
                    <p className="font-bold text-sm line-clamp-1 italic">{nextChapterObj?.title}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              ) : <div className="flex-1" />}
            </nav>
          </article>
        </main>

        <AnimatePresence>
          {selectedParagraph && (
            <>
              {/* Desktop Sidebar */}
              <aside className="w-96 hidden xl:block sticky top-16 h-[calc(100vh-64px)] z-30 overflow-hidden border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <CommentSidebar
                  chapterId={chapterId}
                  paragraphId={selectedParagraph}
                  initialComments={comments}
                  onClose={() => setSelectedParagraph(null)}
                />
              </aside>

              {/* Mobile/Tablet Overlay */}
              <div
                className="fixed inset-0 z-50 xl:hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setSelectedParagraph(null)}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 h-[80vh] bg-background border-t border-border rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CommentSidebar
                    chapterId={chapterId}
                    paragraphId={selectedParagraph}
                    initialComments={comments}
                    onClose={() => setSelectedParagraph(null)}
                  />
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeCharacter && (
          <CharacterTooltip
            character={activeCharacter}
            position={tooltipPos}
            onClose={() => setActiveCharacter(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTOC && (
          <TableOfContents
            isOpen={showTOC}
            onClose={() => setShowTOC(false)}
            chapters={chapters}
            volumes={volumes}
            storySlug={storySlug}
            currentChapterSlug={chapterSlug}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
