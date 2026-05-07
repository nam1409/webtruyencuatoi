"use client";

import React, { JSX } from 'react';
import { useReader } from '../context/ReaderContext';
import { MessageSquare, Info } from 'lucide-react';

interface StaticContentProps {
  content: any;
  settings: {
    fontSize: number;
    font: string;
    lineHeight: number;
  };
  commentCounts?: Record<string, number>;
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
          className="relative inline cursor-help border-b-2 border-dotted border-primary/40 hover:border-primary hover:bg-primary/5 transition-all rounded-sm px-0.5"
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

export function StaticContent({ content, settings: initialSettings, commentCounts: initialCounts = {} }: StaticContentProps) {
  const { setSelectedParagraph, setSidebarOpen, comments, settings } = useReader();

  // Use dynamic settings from context, fallback to props if needed
  const activeSettings = settings || initialSettings;

  // Merge initial server counts with real-time client comments
  const dynamicCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ...initialCounts };
    if (comments && comments.length > 0) {
      // If we have client comments, they should take precedence or be added
      // Actually, since comments list from ReaderLayout includes all approved comments,
      // it's better to just recalculate everything to be safe.
      const freshCounts: Record<string, number> = {};
      comments.forEach(c => {
        if (c.paragraph_id) {
          freshCounts[c.paragraph_id] = (freshCounts[c.paragraph_id] || 0) + 1;
        }
      });
      return freshCounts;
    }
    return counts;
  }, [comments, initialCounts]);

  const commentCounts = dynamicCounts;

  if (!content || !content.content) return null;

  const renderNode = (node: any, index: number) => {
    const nodeId = node.attrs?.['paragraph-id'] || index;
    const isSelected = nodeId === activeSettings?.selectedParagraph; // If we had this

    switch (node.type) {
      case 'paragraph':
        return (
          <p 
            key={nodeId} 
            data-paragraph-id={nodeId} 
            className={`mb-6 transition-all duration-300 cursor-pointer hover:bg-primary/5 rounded-xl px-2 -mx-2 relative group`}
            style={{ 
              fontSize: `${activeSettings.fontSize}px`,
              lineHeight: activeSettings.lineHeight,
            }}
            onClick={() => {
              setSelectedParagraph(nodeId);
              setSidebarOpen(true);
            }}
          >
            {node.content?.map((child: any, i: number) => renderChild(child, i))}
            {commentCounts[nodeId] > 0 && (
              <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary align-middle transform transition-transform group-hover:scale-110">
                <MessageSquare className="w-2.5 h-2.5 fill-primary" />
                {commentCounts[nodeId]}
              </span>
            )}
          </p>
        );

      case 'heading':
        const Level = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <Level 
            key={nodeId} 
            data-paragraph-id={nodeId}
            className="font-bold my-6 relative group cursor-pointer pr-12"
            style={{ 
              fontSize: `${activeSettings.fontSize + (6 - (node.attrs?.level || 2)) * 2}px`,
            }}
            onClick={() => {
              setSelectedParagraph(nodeId);
              setSidebarOpen(true);
            }}
          >
            {node.content?.map((child: any, i: number) => renderChild(child, i))}
            {commentCounts[nodeId] > 0 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-md border border-primary/20 text-[10px] font-black text-primary transition-all shadow-sm">
                <MessageSquare className="w-3 h-3 fill-primary" />
                {commentCounts[nodeId]}
              </span>
            )}
          </Level>
        );

      case 'image':
      case 'zenImage':
        return (
          <div key={nodeId} className="my-8 flex flex-col items-center">
            <img 
              src={node.attrs?.src} 
              alt={node.attrs?.alt || ''} 
              className="max-w-full h-auto rounded-lg shadow-md"
            />
            {node.attrs?.title && (
              <p className="text-sm text-muted-foreground mt-2 italic">{node.attrs.title}</p>
            )}
          </div>
        );

      case 'horizontalRule':
        return <hr key={nodeId} className="my-12 border-t border-muted/30 w-1/3 mx-auto" />;

      default:
        return null;
    }
  };

  const renderChild = (child: any, index: number) => {
    if (child.type === 'text') {
      let text = child.text;
      
      // Handle marks (bold, italic, etc)
      if (child.marks) {
        let element = <span>{text}</span>;
        child.marks.forEach((mark: any) => {
          if (mark.type === 'bold') element = <strong key={index}>{element}</strong>;
          if (mark.type === 'italic') element = <em key={index}>{element}</em>;
          if (mark.type === 'underline') element = <u key={index}>{element}</u>;
          if (mark.type === 'strike') element = <s key={index}>{element}</s>;
          if (mark.type === 'spoiler') element = <SpoilerSpan key={index}>{element}</SpoilerSpan>;
          if (mark.type === 'annotation') element = <AnnotationSpan key={index} note={mark.attrs?.note || ''}>{element}</AnnotationSpan>;
        });
        return element;
      }
      
      return <span key={index}>{text}</span>;
    }
    return null;
  };

  return (
    <div 
      className={`prose prose-lg max-w-none ${activeSettings.font.startsWith('font-') ? activeSettings.font : ''}`}
      style={{ fontFamily: activeSettings.font.startsWith('font-') ? undefined : 'var(--reader-font)' }}
    >
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </div>
  );
}
