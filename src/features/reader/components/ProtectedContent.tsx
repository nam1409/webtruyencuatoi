"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CanvasText } from './CanvasText';
import { useReader } from '../context/ReaderContext';
import { Loader2, MessageSquare } from 'lucide-react';
import { ChapterPasswordGate } from './ChapterPasswordGate';
import { SpoilerSpan, AnnotationSpan } from './StaticContent';
import { JSX } from 'react/jsx-runtime';
import Image from 'next/image';
import { deobfuscateKey } from '@/lib/obfuscator';
import { hash, getAntiCopyStyles } from '@/lib/anti-copy';
import { useSearchParams } from 'next/navigation';

import { StaticContent } from './StaticContent';

interface ProtectedContentProps {
  chapterId: string;
  isProtected: boolean;
  initialContent?: any;
}

export const ProtectedContent: React.FC<ProtectedContentProps> = ({
  chapterId,
  isProtected,
  initialContent
}) => {
  const { settings, setSelectedParagraph, setSidebarOpen, comments } = useReader();
  const searchParams = useSearchParams();
  const versionId = searchParams.get('v');

  const [content, setContent] = useState<any>(() => {
    if (!initialContent) return null;
    
    // Normalize format
    if (initialContent.type === 'doc') {
      return initialContent;
    }
    return initialContent;
  });

  const [loading, setLoading] = useState(!initialContent);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordHint, setPasswordHint] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate comment counts
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
      const fetchUrl = versionId 
        ? `/api/chapters/${chapterId}/content?v=${versionId}` 
        : `/api/chapters/${chapterId}/content`;

      const response = await fetch(fetchUrl, {
        headers: password ? { 'x-chapter-password': encodeURIComponent(password) } : {}
      });

      const data = await response.json();

      if (response.status === 403 && data.is_locked) {
        setIsLocked(true);
        setPasswordHint(data.password_hint);
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
  }, [chapterId, versionId]);

  // Check if we should use Canvas Rendering (Only for glyph-obfuscated content)
  const hasGlyphs = useMemo(() => {
    if (!content || content.is_rendered) return false;
    const data = content.data || content;
    if (!data.content) return false;
    return data.content.some((node: any) => 
      node.content?.some((c: any) => c.glyphs && c.glyphs.length > 0)
    );
  }, [content]);

  const themeColor = (settings.theme === 'dark' || settings.theme === 'oled')
    ? '#e2e8f0'
    : (settings.theme === 'sepia' ? '#433422' : '#0f172a');

  return (
    <div ref={containerRef} className="w-full">
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
        <ChapterPasswordGate 
          onUnlock={fetchContent} 
          error={passwordError} 
          hint={passwordHint} 
          chapterId={chapterId} 
        />
      ) : hasGlyphs ? (
        // Canvas Rendering Branch (Legacy Protection)
        <div className="space-y-4">
          {(content.data?.content || content.content || []).map((node: any, index: number) => {
            const attrs = node.attrs || {};
            const nodeId = attrs['paragraph-id'] || attrs.paragraphId || attrs.paragraph_id || index;

            if (node.type === 'paragraph' || node.type === 'heading') {
              const segments = node.content?.map((c: any) => ({
                glyphs: c.glyphs || [],
                isSpoiler: c.marks?.some((m: any) => m.type === 'spoiler')
              })).filter((s: any) => s.glyphs.length > 0) || [];

              return (
                <div
                  key={nodeId}
                  id={nodeId.toString()}
                  className="relative group cursor-pointer pr-14 mb-6"
                >
                  <CanvasText
                    segments={segments}
                    mapping={content.key}
                    fontSize={node.type === 'heading' ? settings.fontSize + 8 : settings.fontSize}
                    fontFamily={settings.font === 'font-serif' ? 'serif' : (settings.font === 'font-sans' ? 'sans-serif' : settings.font)}
                    lineHeight={settings.lineHeight}
                    color={themeColor}
                    maxWidth={containerWidth - 56}
                    theme={settings.theme}
                    commentCount={commentCounts[nodeId]}
                    onSelect={() => {
                      setSelectedParagraph(nodeId);
                      setSidebarOpen(true);
                    }}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        // Standard, Hardened, and Hardcore Rendering Branch
        // ALL use the same unified isomorphic renderer via StaticContent
        <StaticContent
          chapterId={chapterId}
          content={content.is_rendered ? content : (content.data || content)}
          settings={settings}
          commentCounts={commentCounts}
        />
      )}
    </div>
  );
};
