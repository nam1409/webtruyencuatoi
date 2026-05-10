"use client";
import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Maximize, ExternalLink, Trash2, GripHorizontal, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ZenEmbedView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, width, height, align } = node.attrs;
  
  const [isResizing, setIsResizing] = useState(false);
  const [initialHeight, setInitialHeight] = useState(height);
  const [initialY, setInitialY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = (direction: 'bottom' | 'right' | 'bottom-right' | 'corner') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startWidth = containerRef.current?.offsetWidth || 800;
    const startHeight = containerRef.current?.offsetHeight || 450;
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (direction.includes('bottom') || direction === 'corner') {
        const newHeight = Math.max(100, startHeight + deltaY);
        updateAttributes({ height: newHeight.toString() });
      }
      
      if (direction.includes('right') || direction === 'corner') {
        const newWidth = Math.max(200, startWidth + deltaX);
        updateAttributes({ width: `${newWidth}px` });
      }
    };

    const stopResizing = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  return (
    <NodeViewWrapper className="zen-embed-node-view my-8">
      <div 
        ref={containerRef}
        className={cn(
          "group relative mx-auto transition-all duration-300 rounded-2xl overflow-visible border-2",
          selected ? "border-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]" : "border-transparent",
          isResizing ? "select-none" : "",
          "flex"
        )}
        style={{ 
          width: width || '100%', 
          height: `${height || 450}px`,
          justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
          marginLeft: align === 'left' ? '0' : align === 'right' ? 'auto' : 'auto',
          marginRight: align === 'right' ? '0' : align === 'left' ? 'auto' : 'auto'
        }}
      >
        <iframe
          src={src}
          className="w-full h-full border-0 pointer-events-none"
          allowFullScreen
        />
        
        {/* Editor Overlay */}
        <div className="absolute inset-0 z-10 bg-transparent cursor-default" />

        {/* Floating Controls Overlay - Appear on Hover */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 duration-300">
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 shadow-2xl rounded-xl p-1 overflow-hidden backdrop-blur-xl">
            <button
              onClick={() => {
                const newHeight = window.prompt('Nhập chiều cao (px):', height);
                if (newHeight) updateAttributes({ height: newHeight });
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all"
              title="Chỉnh chiều cao"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Chiều cao</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            
            {/* Alignment Controls */}
            <div className="flex items-center">
              <button
                onClick={() => updateAttributes({ align: 'left' })}
                className={cn(
                  "p-1.5 hover:bg-white/10 rounded-lg transition-all",
                  align === 'left' ? "text-primary bg-primary/20" : "text-white/40 hover:text-white"
                )}
                title="Căn trái"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateAttributes({ align: 'center' })}
                className={cn(
                  "p-1.5 hover:bg-white/10 rounded-lg transition-all",
                  align === 'center' || !align ? "text-primary bg-primary/20" : "text-white/40 hover:text-white"
                )}
                title="Căn giữa"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateAttributes({ align: 'right' })}
                className={cn(
                  "p-1.5 hover:bg-white/10 rounded-lg transition-all",
                  align === 'right' ? "text-primary bg-primary/20" : "text-white/40 hover:text-white"
                )}
                title="Căn phải"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => {
                if ((props.editor as any).openEmbedDialog) {
                  (props.editor as any).openEmbedDialog();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all"
              title="Đổi nguồn"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Đổi mã</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => deleteNode()}
              className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-all"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resize Handle - Bottom Bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 z-20 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40"
          onMouseDown={startResizing('bottom')}
        >
          <div className="w-12 h-1 bg-primary/80 rounded-full" />
        </div>

        {/* Resize Handle - Right Bar */}
        <div 
          className="absolute top-0 right-0 bottom-0 w-2 z-20 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40"
          onMouseDown={startResizing('right')}
        >
          <div className="h-12 w-1 bg-primary/80 rounded-full" />
        </div>

        {/* 4 Corners Handles */}
        <div 
          className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-primary/40 hover:border-primary opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-nw-resize" 
          onMouseDown={startResizing('corner')}
        />
        <div 
          className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-primary/40 hover:border-primary opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-ne-resize"
          onMouseDown={startResizing('corner')}
        />
        <div 
          className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-primary/40 hover:border-primary opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-sw-resize"
          onMouseDown={startResizing('corner')}
        />
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-primary/40 hover:border-primary opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-se-resize"
          onMouseDown={startResizing('corner')}
        />
      </div>
    </NodeViewWrapper>
  );
};
