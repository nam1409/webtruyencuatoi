import React from 'react';
import { useReader } from '../context/ReaderContext';
import { deobfuscateKey } from '@/lib/obfuscator';

interface TextSegment {
  text: string;
  isSpoiler?: boolean;
}

interface CanvasTextProps {
  segments: TextSegment[];
  mapping: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  color: string;
  maxWidth: number;
  theme?: string;
  commentCount?: number;
}

export const CanvasText = React.memo(({ 
  segments, 
  mapping, 
  fontSize, 
  fontFamily, 
  lineHeight, 
  color, 
  maxWidth,
  theme,
  commentCount = 0
}: CanvasTextProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [revealedSpoilers, setRevealedSpoilers] = React.useState<Set<number>>(new Set());

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.font = `${fontSize}px ${fontFamily}`;
    
    const lineHeightPx = fontSize * lineHeight;
    const spoilerRegions: { rect: { x: number, y: number, w: number, h: number }, id: number }[] = [];

    const renderText = (isActualRender: boolean) => {
      let xOffset = 0;
      let yOffset = fontSize;
      
      segments.forEach((segment, segmentIndex) => {
        const words = segment.text.split(' ');
        
        words.forEach((word, wordIndex) => {
          const wordWithSpace = wordIndex === words.length - 1 ? word : word + ' ';
          const metrics = ctx.measureText(wordWithSpace);
          const wordWidth = metrics.width;

          if (xOffset + wordWidth > maxWidth && xOffset > 0) {
            xOffset = 0;
            yOffset += lineHeightPx;
          }

          if (isActualRender) {
            ctx.save();
            if (segment.isSpoiler && !revealedSpoilers.has(segmentIndex)) {
              ctx.filter = 'blur(12px)';
              ctx.globalAlpha = 0.8;
              spoilerRegions.push({
                rect: { x: xOffset * dpr, y: (yOffset - fontSize) * dpr, w: wordWidth * dpr, h: fontSize * dpr },
                id: segmentIndex
              });
            }

            ctx.fillStyle = color;
            ctx.fillText(wordWithSpace, xOffset, yOffset);
            ctx.restore();
          }

          xOffset += wordWidth;
        });
      });

      // Draw comment count if exists
      if (commentCount > 0 && isActualRender) {
        const countText = commentCount.toString();
        const bubbleFontSize = Math.max(10, Math.floor(fontSize * 0.6));
        ctx.font = `bold ${bubbleFontSize}px sans-serif`;
        const metrics = ctx.measureText(countText);
        const bubbleWidth = metrics.width + 12;
        const bubbleHeight = Math.max(16, Math.floor(fontSize * 0.8));
        
        // If bubble doesn't fit on current line, move to next
        if (xOffset + bubbleWidth > maxWidth) {
          xOffset = 0;
          yOffset += lineHeightPx;
        }

        const bubbleX = xOffset + 8;
        const bubbleY = yOffset - (fontSize * 0.4);

        ctx.save();
        // Bubble background
        ctx.beginPath();
        if (ctx.roundRect) {
           ctx.roundRect(bubbleX, bubbleY - (bubbleHeight * 0.7), bubbleWidth, bubbleHeight, 6);
        } else {
           ctx.rect(bubbleX, bubbleY - (bubbleHeight * 0.7), bubbleWidth, bubbleHeight);
        }
        ctx.fillStyle = theme === 'dark' || theme === 'oled' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)';
        ctx.fill();
        
        // Bubble text
        ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'center';
        ctx.fillText(countText, bubbleX + (bubbleWidth / 2), bubbleY);
        ctx.restore();
      }

      return yOffset + (lineHeightPx - fontSize);
    };

    const totalHeight = renderText(false);
    canvas.width = maxWidth * dpr;
    canvas.height = (totalHeight + 10) * dpr;
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${totalHeight + 10}px`;
    
    ctx.scale(dpr, dpr);
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontSize}px ${fontFamily}`;
    renderText(true);

    (canvas as any)._spoilerRegions = spoilerRegions;
  }, [segments, fontSize, fontFamily, lineHeight, color, maxWidth, revealedSpoilers, commentCount, theme]);

  React.useEffect(() => {
    // Wait for fonts to be ready
    document.fonts.ready.then(() => {
      draw();
    });
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
    const y = (e.clientY - rect.top) * (window.devicePixelRatio || 1);

    const regions = (canvas as any)._spoilerRegions || [];
    for (const region of regions) {
      if (x >= region.rect.x && x <= region.rect.x + region.rect.w &&
          y >= region.rect.y && y <= region.rect.y + region.rect.h) {
        setRevealedSpoilers(prev => {
          const next = new Set(prev);
          next.add(region.id);
          return next;
        });
        e.stopPropagation();
        break;
      }
    }
  };

  return (
    <div className="relative inline-block w-full">
      <canvas 
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="block"
      />
    </div>
  );
});

CanvasText.displayName = 'CanvasText';
