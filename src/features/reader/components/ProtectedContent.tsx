"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CanvasText } from './CanvasText';
import { useReader } from '../context/ReaderContext';
import { Loader2, MessageSquare } from 'lucide-react';
import { ChapterPasswordGate } from './ChapterPasswordGate';
import { SpoilerSpan, AnnotationSpan } from './StaticContent';
import { JSX } from 'react/jsx-runtime';
import Image from 'next/image';
import { deobfuscateKey } from '@/lib/obfuscator';

interface ProtectedParagraphProps {
  node: any;
  nodeId: string | number;
  settings: any;
  themeColor: string;
  containerWidth: number;
  commentCounts: Record<string, number>;
  setSelectedParagraph: (id: string | number) => void;
  setSidebarOpen: (open: boolean) => void;
  isProtected: boolean;
  contentIsProtected: boolean;
  contentKey: string;
}

const ProtectedParagraph = React.memo(({ 
  node, nodeId, settings, themeColor, containerWidth, commentCounts, 
  setSelectedParagraph, setSidebarOpen, isProtected, contentIsProtected, contentKey 
}: ProtectedParagraphProps) => {
  const glyphs = node.content?.flatMap((c: any) => c.glyphs || []) || [];
  const shouldShowCanvas = contentIsProtected || (!!isProtected && glyphs.length > 0);

  // Helper function to render text with marks (including spoiler)
  const renderTextWithMarks = (content: any[]) => {
    return content.map((c: any, i: number) => {
      if (c.type !== 'text') return null;
      let element = <span key={i}>{c.text}</span>;
      
      if (c.marks) {
        c.marks.forEach((mark: any) => {
          if (mark.type === 'bold') element = <strong key={i}>{element}</strong>;
          if (mark.type === 'italic') element = <em key={i}>{element}</em>;
          if (mark.type === 'underline') element = <u key={i}>{element}</u>;
          if (mark.type === 'strike') element = <s key={i}>{element}</s>;
          if (mark.type === 'spoiler') element = <SpoilerSpan key={i}>{element}</SpoilerSpan>;
          if (mark.type === 'annotation') element = <AnnotationSpan key={i} note={mark.attrs?.note || ''}>{element}</AnnotationSpan>;
        });
      }
      return element;
    });
  };

  if (!shouldShowCanvas || glyphs.length === 0) {
    // Render normal HTML if not protected
    const textContent = node.content || [];
    return (
      <p 
        key={nodeId} 
        data-paragraph-id={nodeId} 
        className="relative group cursor-pointer pr-12"
        style={{ 
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          marginBottom: 'var(--reader-p-spacing)',
        }}
        onClick={() => {
          setSelectedParagraph(nodeId);
          setSidebarOpen(true);
        }}
      >
        {renderTextWithMarks(textContent)}
        {commentCounts[nodeId] > 0 && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 text-[10px] font-black text-primary transition-all shadow-sm">
            <MessageSquare className="w-3 h-3 fill-primary" />
            {commentCounts[nodeId]}
          </span>
        )}
      </p>
    );
  }

  // Memoize segments calculation to avoid lag
  const segments = React.useMemo(() => {
    return node.content?.map((c: any) => ({
      glyphs: c.glyphs || [],
      isSpoiler: c.marks?.some((m: any) => m.type === 'spoiler')
    })).filter((s: any) => s.glyphs.length > 0) || [];
  }, [node.content]);

  return (
    <div 
      key={`${nodeId}-${settings.theme}`} 
      data-paragraph-id={nodeId} 
      className="relative group cursor-pointer pr-14"
      style={{
        marginBottom: 'var(--reader-p-spacing)',
      }}
      onClick={() => {
        setSelectedParagraph(nodeId);
        setSidebarOpen(true);
      }}
    >
      <CanvasText 
        segments={segments}
        mapping={contentKey}
        fontSize={settings.fontSize}
        fontFamily={settings.font === 'font-serif' ? 'serif' : (settings.font === 'font-sans' ? 'sans-serif' : settings.font)}
        lineHeight={settings.lineHeight}
        color={themeColor}
        maxWidth={containerWidth - 56}
        theme={settings.theme}
        commentCount={commentCounts[nodeId]}
      />
      {/* Accessibility: Hidden text for screen readers */}
      <div className="sr-only">
        {segments.map((s: any, i: number) => {
          const charMap = deobfuscateKey(contentKey);
          const segmentText = s.glyphs?.map((idx: number) => charMap[idx] || '').join('') || '';
          return <span key={i}>{s.isSpoiler ? '[Nội dung ẩn]' : segmentText}</span>;
        })}
      </div>
    </div>
  );
});

const ProtectedHeading = React.memo(({ 
  node, nodeId, settings, themeColor, containerWidth, commentCounts, 
  setSelectedParagraph, setSidebarOpen, isProtected, contentIsProtected, contentKey 
}: ProtectedParagraphProps) => {
  const glyphs = node.content?.flatMap((c: any) => c.glyphs || []) || [];
  const shouldShowCanvas = contentIsProtected || (!!isProtected && glyphs.length > 0);

  const renderTextWithMarks = (content: any[]) => {
    return content.map((c: any, i: number) => {
      if (c.type !== 'text') return null;
      let element = <span key={i}>{c.text}</span>;
      
      if (c.marks) {
        c.marks.forEach((mark: any) => {
          if (mark.type === 'bold') element = <strong key={i}>{element}</strong>;
          if (mark.type === 'italic') element = <em key={i}>{element}</em>;
          if (mark.type === 'underline') element = <u key={i}>{element}</u>;
          if (mark.type === 'strike') element = <s key={i}>{element}</s>;
          if (mark.type === 'spoiler') element = <SpoilerSpan key={i}>{element}</SpoilerSpan>;
          if (mark.type === 'annotation') element = <AnnotationSpan key={i} note={mark.attrs?.note || ''}>{element}</AnnotationSpan>;
        });
      }
      return element;
    });
  };

  if (!shouldShowCanvas || glyphs.length === 0) {
    const Level = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
    return (
      <Level 
        key={nodeId} 
        data-paragraph-id={nodeId}
        className="font-bold my-6 relative group cursor-pointer pr-12"
        style={{ 
          fontSize: `${settings.fontSize + (6 - (node.attrs?.level || 2)) * 2}px`,
        }}
        onClick={() => {
          setSelectedParagraph(nodeId);
          setSidebarOpen(true);
        }}
      >
        {renderTextWithMarks(node.content || [])}
        {commentCounts[nodeId] > 0 && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 text-[10px] font-black text-primary transition-all shadow-sm">
            <MessageSquare className="w-3 h-3 fill-primary" />
            {commentCounts[nodeId]}
          </span>
        )}
      </Level>
    );
  }

  const segments = React.useMemo(() => {
    return node.content?.map((c: any) => ({
      glyphs: c.glyphs || [],
      isSpoiler: c.marks?.some((m: any) => m.type === 'spoiler')
    })).filter((s: any) => s.glyphs.length > 0) || [];
  }, [node.content]);

  return (
    <div 
      key={`${nodeId}-${settings.theme}`} 
      className="py-4 relative group cursor-pointer pr-14"
      onClick={() => {
        setSelectedParagraph(nodeId);
        setSidebarOpen(true);
      }}
    >
      <CanvasText 
        segments={segments}
        mapping={contentKey}
        fontSize={settings.fontSize + (6 - (node.attrs?.level || 2)) * 2}
        fontFamily={settings.font === 'font-serif' ? 'serif' : (settings.font === 'font-sans' ? 'sans-serif' : settings.font)}
        lineHeight={settings.lineHeight}
        color={themeColor}
        maxWidth={containerWidth - 56}
        theme={settings.theme}
        commentCount={commentCounts[nodeId]}
      />
      {/* Accessibility: Hidden text for screen readers */}
      <div className="sr-only">
        {segments.map((s: any, i: number) => {
          const charMap = deobfuscateKey(contentKey);
          const segmentText = s.glyphs?.map((idx: number) => charMap[idx] || '').join('') || '';
          return <span key={i}>{s.isSpoiler ? '[Tiêu đề ẩn]' : segmentText}</span>;
        })}
      </div>
    </div>
  );
});

interface ProtectedContentProps {
  chapterId: string;
  isProtected: boolean;
}

export const ProtectedContent: React.FC<ProtectedContentProps> = ({ 
  chapterId, 
  isProtected
}) => {
  const { settings, setSelectedParagraph, setSidebarOpen, refreshKey, comments } = useReader();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate comment counts from the passed comments prop
  const commentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    comments.forEach(c => {
      if (c.paragraph_id) {
        counts[c.paragraph_id] = (counts[c.paragraph_id] || 0) + 1;
      }
    });
    return counts;
  }, [comments]);

  const fetchContent = async (password?: string) => {
    setLoading(true);
    setPasswordError(null);
    try {
      const response = await fetch(`/api/chapters/${chapterId}/content`, {
        headers: password ? { 'x-chapter-password': password } : {}
      });
      
      const data = await response.json();

      if (response.status === 403 && data.is_locked) {
        setIsLocked(true);
        if (password) {
          setPasswordError("Mật khẩu không chính xác.");
          localStorage.removeItem(`chapter_password_${chapterId}`);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content");
      }
      
      setContent(data);
      setIsLocked(false);
      
      // Save password to localStorage on success
      if (password) {
        localStorage.setItem(`chapter_password_${chapterId}`, password);
      }
    } catch (error: any) {
      console.error("Failed to fetch chapter content:", error);
      setPasswordError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) setContainerWidth(width);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (chapterId) {
      const savedPassword = localStorage.getItem(`chapter_password_${chapterId}`);
      if (savedPassword) {
        fetchContent(savedPassword);
      } else {
        fetchContent();
      }
    }
  }, [chapterId]);

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-hidden">
      {loading ? (
        <div className="space-y-8 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-muted/40 rounded-full w-full" style={{ width: `${Math.random() * 40 + 60}%` }} />
          ))}
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
          </div>
        </div>
      ) : isLocked ? (
        <ChapterPasswordGate onUnlock={fetchContent} error={passwordError} />
      ) : (!content || !content.data || !content.data.content) ? (
        <div className="text-center py-20 text-muted-foreground italic">
          Không có nội dung để hiển thị.
        </div>
      ) : (
        <div className="space-y-4 w-full" data-is-protected={!!isProtected}>
          {(content.data?.content || []).map((node: any, index: number) => {
            const nodeId = node.attrs?.['paragraph-id'] || index;
            const themeColor = (settings.theme === 'dark' || settings.theme === 'oled') 
              ? '#e2e8f0' 
              : (settings.theme === 'sepia' ? '#433422' : '#0f172a');
            
            if (node.type === 'paragraph') {
              return (
                <ProtectedParagraph 
                  key={nodeId}
                  node={node}
                  nodeId={nodeId}
                  settings={settings}
                  themeColor={themeColor}
                  containerWidth={containerWidth}
                  commentCounts={commentCounts}
                  setSelectedParagraph={setSelectedParagraph}
                  setSidebarOpen={setSidebarOpen}
                  isProtected={isProtected}
                  contentIsProtected={content.is_protected}
                  contentKey={content.key}
                />
              );
            }

            if (node.type === 'heading') {
              return (
                <ProtectedHeading 
                  key={nodeId}
                  node={node}
                  nodeId={nodeId}
                  settings={settings}
                  themeColor={themeColor}
                  containerWidth={containerWidth}
                  commentCounts={commentCounts}
                  setSelectedParagraph={setSelectedParagraph}
                  setSidebarOpen={setSidebarOpen}
                  isProtected={isProtected}
                  contentIsProtected={content.is_protected}
                  contentKey={content.key}
                />
              );
            }

            if (node.type === 'image' || node.type === 'zenImage') {
              const src = node.attrs?.src;
              const alt = node.attrs?.alt || '';
              const width = node.attrs?.width || '100%';
              const align = node.attrs?.align || 'center';
              const layout = node.attrs?.layout || 'block';

              if (!src) return null;

              return (
                <div 
                  key={nodeId} 
                  data-paragraph-id={nodeId} 
                  className={`my-8 flex ${align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'} ${layout === 'float-left' ? 'float-left mr-8 max-w-[50%]' : layout === 'float-right' ? 'float-right ml-8 max-w-[50%]' : 'clear-both'}`}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 shadow-lg" style={{ width: layout.startsWith('float') ? '100%' : width, aspectRatio: 'auto' }}>
                    <img 
                      src={src} 
                      alt={alt} 
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              );
            }

            if (node.type === 'horizontalRule') {
              return <hr key={nodeId} className="my-12 border-t border-muted/30 w-1/3 mx-auto" />;
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
