"use client";

import React, { JSX, useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReader } from '../context/ReaderContext';
import { MessageSquare, Info, User as UserIcon, Loader2 } from 'lucide-react';
import { CharacterTooltip } from './CharacterTooltip';
import { AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getAntiCopyStyles, hash, renderToHtml } from '@/lib/anti-copy';
import { cn } from "@/lib/utils";

interface StaticContentProps {
  content: any;
  settings: {
    fontSize: number;
    font: string;
    lineHeight: number;
    paragraphSpacing: number;
  };
  commentCounts?: Record<string, number>;
  characters?: any[];
  showComments?: boolean;
  chapterId: string;
}

export const SpoilerSpan = ({ children }: { children: React.ReactNode }) => {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <span 
      className={`spoiler-text ${revealed ? 'revealed' : ''} cursor-pointer transition-all duration-300 rounded px-1 mx-0.5`}
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(!revealed);
      }}
      title={revealed ? "Click để ẩn lại" : "Click để xem nội dung ẩn (Spoiler)"}
    >
      {children}
    </span>
  );
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AnnotationSpan = ({ children, note }: { children: React.ReactNode, note: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span 
          className="annotation-span relative inline cursor-help border-b-2 border-dotted border-primary/40 hover:border-primary hover:bg-primary/5 transition-all rounded-sm px-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-2xl border-primary/10">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Info className="w-5 h-5" />
            Giải thích nội dung
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-base leading-relaxed text-foreground/90 italic">
          "{note}"
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function StaticContent({ 
  content, 
  settings: initialSettings, 
  commentCounts: initialCounts = {}, 
  characters = [], 
  showComments = true,
  chapterId
}: StaticContentProps) {
  // 1. Hooks & State (ALWAYS AT TOP)
  const { setSelectedParagraph, setSidebarOpen, comments, settings } = useReader();
  const [activeChar, setActiveChar] = React.useState<any>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
  const [placeholders, setPlaceholders] = useState<Element[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll animation observer
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Use a small timeout to ensure DOM is fully ready after render/innerHTML
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.01,
          rootMargin: '0px' // Trigger exactly when visible
        }
      );

      const animatedElements = containerRef.current.querySelectorAll('[data-animation]');
      animatedElements.forEach((el) => observer.observe(el));

      return () => {
        animatedElements.forEach((el) => observer.unobserve(el));
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [content, chapterId, mounted]); 

  const junkClassName = useMemo(() => `v-${hash(chapterId + 'junk')}`, [chapterId]);
  const camoClassName = useMemo(() => `v-${hash(chapterId + 'camo')}`, [chapterId]);
  const containerClass = useMemo(() => `v-${hash(chapterId + 'container')}`, [chapterId]);
  
  const activeSettings = settings || initialSettings;

  const commentCounts = useMemo(() => {
    if (!showComments) return {};
    
    // Nếu có dữ liệu comments từ Realtime/ReaderContext, dùng nó hoàn toàn
    if (comments) {
      const freshCounts: Record<string, number> = {};
      comments.forEach(c => {
        if (c.paragraph_id && c.is_approved) {
          freshCounts[c.paragraph_id] = (freshCounts[c.paragraph_id] || 0) + 1;
        }
      });
      return freshCounts;
    }
    
    // Fallback về dữ liệu ban đầu từ SSR
    return { ...initialCounts };
  }, [comments, initialCounts, showComments]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const processedHtml = useMemo(() => {
    if (!content) return '';

    try {
      let decoded = '';
      if (content?.is_rendered && typeof content.html === 'string') {
        decoded = typeof window !== 'undefined' 
          ? decodeURIComponent(escape(window.atob(content.html)))
          : '';
      } else if (content?.type === 'doc') {
        decoded = renderToHtml(content, chapterId, { isHardcore: false });
      } else {
        return '';
      }
      
      if (!showComments || typeof window === 'undefined') return decoded;

      // Dùng DOMParser để chèn Badge một cách chính xác nhất (Chỉ chạy ở Client)
      const parser = new DOMParser();
      const doc = parser.parseFromString(decoded, 'text/html');
      const placeholders = doc.querySelectorAll('[data-comment-placeholder]');

      placeholders.forEach(el => {
        const pid = el.getAttribute('data-comment-placeholder');
        const count = pid ? commentCounts[pid] : 0;
        
        if (count > 0) {
          el.className = 'comment-bubble absolute -right-8 top-0 flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-[10px] font-black cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all shadow-sm z-10';
          el.innerHTML = count.toString();
          el.setAttribute('data-paragraph-id', pid!);
          
          if (el.parentElement) {
            el.parentElement.style.position = 'relative';
          }
        } else {
          el.innerHTML = '';
          el.className = '';
        }
      });

      return doc.body.innerHTML;
    } catch (e) {
      console.error("Error processing anti-copy HTML:", e);
      return '';
    }
  }, [content?.is_rendered, content?.html, commentCounts, showComments, chapterId]);

  // 2. Handlers
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const paragraph = target.closest('[data-paragraph-id]');
    
    if (paragraph && !target.closest('.spoiler-text, .character-mention, .annotation-span, [data-slot="dialog-trigger"]')) {
      const paragraphId = paragraph.getAttribute('data-paragraph-id');
      if (paragraphId && showComments) {
        setSelectedParagraph(paragraphId);
        setSidebarOpen(true);
      }
    }
  };

  const renderMarks = (text: string, marks: any[]) => {
    if (!marks || marks.length === 0) return text;
    
    let result: React.ReactNode = text;
    
    // Sort marks to ensure consistent nesting (e.g., link always inside or outside)
    const sortedMarks = [...marks].sort((a, b) => {
      const order = ['link', 'bold', 'italic', 'underline', 'strike', 'spoiler', 'annotation', 'characterMention', 'math'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });

    sortedMarks.forEach(mark => {
      switch (mark.type) {
        case 'bold':
          result = <strong key={mark.type}>{result}</strong>;
          break;
        case 'italic':
          result = <em key={mark.type}>{result}</em>;
          break;
        case 'underline':
          const isInsideLink = marks.some(m => m.type === 'link');
          if (isInsideLink) {
            result = <span key={mark.type}>{result}</span>;
          } else {
            result = <u key={mark.type} className="decoration-primary/30 underline-offset-4 border-b border-primary/20 no-underline">{result}</u>;
          }
          break;
        case 'strike':
          result = <s key={mark.type}>{result}</s>;
          break;
        case 'link':
          result = (
            <a 
              key={mark.type}
              href={mark.attrs?.href || '#'} 
              target={mark.attrs?.target || '_blank'} 
              className="text-primary hover:text-primary/80 transition-colors border-b border-primary/40 hover:border-primary no-underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {result}
            </a>
          );
          break;
        case 'spoiler':
          result = <SpoilerSpan key={mark.type}>{result}</SpoilerSpan>;
          break;
        case 'annotation':
          result = <AnnotationSpan key={mark.type} note={mark.attrs?.note || ''}>{result}</AnnotationSpan>;
          break;
        case 'characterMention':
          const charId = mark.attrs?.id;
          const char = charId ? characters.find(c => c.id === charId) : null;
          result = (
            <span 
              key={mark.type}
              className="character-mention inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold cursor-help hover:bg-primary/20 transition-all border border-primary/20"
              onMouseEnter={(e) => {
                if (char) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: rect.left, y: rect.top });
                  setActiveChar(char);
                }
              }}
              onMouseLeave={() => setActiveChar(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <UserIcon className="w-3 h-3 fill-primary/20" />
              {result}
            </span>
          );
          break;
        case 'math':
          try {
            const formula = mark.attrs?.formula || '';
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false
            });
            result = <span key={mark.type} dangerouslySetInnerHTML={{ __html: html }} onClick={(e) => e.stopPropagation()} />;
          } catch (e) {
            result = <code key={mark.type}>{mark.attrs?.formula || ''}</code>;
          }
          break;
        case 'textStyle':
          result = (
            <span 
              key={mark.type} 
              style={{ 
                color: mark.attrs?.color || 'inherit',
                fontSize: mark.attrs?.fontSize || 'inherit'
              }}
            >
              {result}
            </span>
          );
          break;
        case 'highlight':
          result = (
            <span 
              key={mark.type} 
              style={{ 
                backgroundColor: mark.attrs?.color || 'yellow',
                padding: '0.1em 0.3em',
                borderRadius: '0.3em',
                color: 'inherit'
              }}
            >
              {result}
            </span>
          );
          break;
      }
    });
    
    return result;
  };

  const getAnimationProps = (node: any) => {
    const { animation, animationDuration, animationDelay } = node.attrs || {};
    if (!animation) return { className: '', style: {} };
    
    return {
      className: `animate-block-${animation}`,
      style: {
        '--animation-duration': animationDuration === 'slow' ? '1s' : animationDuration === 'fast' ? '0.3s' : '0.6s',
        '--animation-delay': `${animationDelay || 0}ms`,
      } as React.CSSProperties
    };
  };

  const renderNode = (node: any, index: number) => {
    const nodeId = node.attrs?.['paragraph-id'] || index;
    switch (node.type) {
      case 'paragraph': {
        const anim = getAnimationProps(node);
        return (
          <p 
            key={nodeId} 
            data-paragraph-id={nodeId} 
            {...(node.attrs?.animation ? { 'data-animation': node.attrs.animation } : {})}
            className={cn(
              "mb-6 transition-all duration-300 cursor-pointer hover:bg-primary/5 rounded-xl px-2 -mx-2 relative group",
              anim.className
            )}
            style={{ 
              fontSize: `${activeSettings.fontSize}px`,
              lineHeight: activeSettings.lineHeight,
              marginBottom: `${activeSettings.paragraphSpacing}px`,
              textAlign: node.attrs?.textAlign || 'left',
              ...anim.style
            }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('.spoiler-text, .character-mention, .annotation-span, [data-slot="dialog-trigger"]')) {
                return;
              }
              if (showComments) {
                setSelectedParagraph(nodeId);
                setSidebarOpen(true);
              }
            }}
          >
            {(node.content || []).map((child: any, i: number) => {
              if (child.type === 'text') {
                return <React.Fragment key={i}>{renderMarks(child.text, child.marks)}</React.Fragment>;
              }
              return null;
            })}
            {showComments && commentCounts[nodeId] > 0 && (
              <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary align-middle transform transition-transform group-hover:scale-110">
                <MessageSquare className="w-2.5 h-2.5 fill-primary" />
                {commentCounts[nodeId]}
              </span>
            )}
          </p>
        );
      }

      case 'heading': {
        const level = node.attrs?.level || 1;
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        const hFontSize = activeSettings.fontSize + (6 - level) * 2;
        const hAnim = getAnimationProps(node);
        
        return (
          <Tag 
            key={nodeId}
            data-paragraph-id={nodeId}
            {...(node.attrs?.animation ? { 'data-animation': node.attrs.animation } : {})}
            className={cn(
              "font-bold mt-8 mb-4 relative group cursor-pointer pr-12",
              hAnim.className
            )}
            style={{ 
              fontSize: `${hFontSize}px`,
              textAlign: node.attrs?.textAlign || 'left',
              ...hAnim.style
            }}
            onClick={() => {
              if (showComments) {
                setSelectedParagraph(nodeId);
                setSidebarOpen(true);
              }
            }}
          >
            {(node.content || []).map((child: any, i: number) => {
              if (child.type === 'text') {
                return <React.Fragment key={i}>{renderMarks(child.text, child.marks)}</React.Fragment>;
              }
              return null;
            })}
            {showComments && commentCounts[nodeId] > 0 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 text-[10px] font-black text-primary transition-all shadow-sm">
                <MessageSquare className="w-3 h-3 fill-primary" />
                {commentCounts[nodeId]}
              </span>
            )}
          </Tag>
        );
      }

      case 'horizontalRule':
        return <hr key={index} className="my-12 border-t border-muted/30 w-1/3 mx-auto" />;

      case 'image':
      case 'zenImage':
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

      case 'zenEmbed':
        const embedAlign = node.attrs?.align || 'center';
        return (
          <div 
            key={index} 
            className={cn(
              "zen-embed-container my-8 flex",
              embedAlign === 'left' ? 'justify-start' : embedAlign === 'right' ? 'justify-end' : 'justify-center'
            )}
          >
            <iframe 
              src={node.attrs?.src}
              width={node.attrs?.width || '100%'}
              height={node.attrs?.height || '450'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-2xl shadow-lg border border-border/50 max-w-full"
              style={{ 
                width: node.attrs?.width || '100%',
                height: `${node.attrs?.height || 450}px` 
              }}
            />
          </div>
        );

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-outside ml-6 mb-6 space-y-2">
            {(node.content || []).map((child: any, i: number) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-outside ml-6 mb-6 space-y-2">
            {(node.content || []).map((child: any, i: number) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={index} className="pl-1">
            {(node.content || []).map((child: any, i: number) => {
              if (child.type === 'paragraph') {
                return (
                  <span key={i}>
                    {(child.content || []).map((grandchild: any, j: number) => {
                      if (grandchild.type === 'text') {
                        return <React.Fragment key={j}>{renderMarks(grandchild.text, grandchild.marks)}</React.Fragment>;
                      }
                      return null;
                    })}
                  </span>
                );
              }
              return renderNode(child, i);
            })}
          </li>
        );
    }

    return null;
  };

  // 3. Early Returns (AFTER ALL HOOKS)
  if (!content || (!content.content && !content.is_rendered)) return null;

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  // 4. Main Render
  if (content?.is_rendered && content?.html) {
    return (
      <div 
        ref={containerRef}
        className={`${containerClass} ${activeSettings.font.startsWith('font-') ? activeSettings.font : ''}`}
        onClick={handleContainerClick}
      >
        <style 
          id={`anti-copy-static-style-${chapterId.split('-')[0]}`}
          dangerouslySetInnerHTML={{ 
            __html: `
              :root {
                --reader-font-size: ${activeSettings.fontSize}px;
                --reader-line-height: ${activeSettings.lineHeight};
                --reader-paragraph-spacing: ${activeSettings.paragraphSpacing}px;
              }
              ${getAntiCopyStyles(chapterId, junkClassName, camoClassName)}
            `
          }} 
        />
        <div 
          className="rendered-content-hardcore"
          style={{ 
            fontFamily: activeSettings.font.startsWith('font-') ? 'inherit' : 'var(--reader-font)',
            fontSize: `${activeSettings.fontSize}px`,
            lineHeight: activeSettings.lineHeight,
            color: 'inherit',
            backgroundColor: 'transparent'
          }}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
        
        <AnimatePresence>
          {activeChar && (
            <CharacterTooltip 
              character={activeChar}
              position={tooltipPos}
              onClose={() => setActiveChar(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${containerClass} ${activeSettings.font.startsWith('font-') ? activeSettings.font : ''}`}
    >
      {(content.content || []).map((node: any, index: number) => renderNode(node, index))}
      
      <AnimatePresence>
        {activeChar && (
          <CharacterTooltip 
            character={activeChar}
            position={tooltipPos}
            onClose={() => setActiveChar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
