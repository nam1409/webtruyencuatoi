'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ChevronLeft, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      {/* Animated Portal Effect */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative mb-12"
      >
        <div className="absolute inset-0 bg-primary/40 rounded-full blur-3xl opacity-20 animate-pulse" />
        <img 
          src="/portal-404.png" 
          alt="Isekai Portal" 
          className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-full border-4 border-white/5 shadow-[0_0_50px_rgba(var(--primary),0.3)] relative z-10"
        />
        
        {/* Floating Particles Mockup */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 z-20"
        >
          <Sparkles className="w-6 h-6 text-amber-400" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="text-center z-20 max-w-2xl">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-4"
        >
          404
        </motion.h1>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">
            Lạc lối ở dị giới rồi!
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed font-medium">
            Trang bạn đang tìm kiếm dường như đã bị hút vào một cổng không gian hoặc chưa từng tồn tại ở thực tại này.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            asChild
            size="lg"
            className="rounded-full px-8 h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-14 border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 font-bold uppercase tracking-widest text-xs transition-all"
          >
            <button onClick={() => window.history.back()}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Quay lại
            </button>
          </Button>
        </motion.div>

        {/* Quick Search Tip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-16 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white"
        >
          <Search className="w-3 h-3" />
          Thử tìm kiếm tác phẩm khác
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
          Lightnovel Engine — Nexus Portal
        </p>
      </div>
    </div>
  );
}
