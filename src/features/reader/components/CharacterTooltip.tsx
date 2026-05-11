"use client";

import { User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface CharacterTooltipProps {
  character: any;
  position: { x: number; y: number };
  onClose: () => void;
}

export function CharacterTooltip({ character, position, onClose }: CharacterTooltipProps) {
  if (!character) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -100%)' 
      }}
      className="fixed z-[100] w-64 bg-background border border-border shadow-2xl rounded-[2rem] overflow-hidden pointer-events-auto mb-4"
    >
      <div className="relative h-32 bg-primary/10">
        {character.avatar_url ? (
          <OptimizedImage src={character.avatar_url} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <div className="p-6 -mt-12 relative">
        <div className="bg-background rounded-2xl p-4 shadow-xl border border-border/50">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-1">{character.name}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Nhân vật</p>
          <div className="h-px w-8 bg-primary/20 mb-3" />
          <p className="text-xs font-medium leading-relaxed text-foreground/70 line-clamp-4">
            {character.description || "Chưa có thông tin mô tả chi tiết cho nhân vật này."}
          </p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
