"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Book, TrendingUp, MessageSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getGlobalStats } from "@/actions/admin";
import { motion } from "framer-motion";

export function StatsCards() {
  const [stats, setStats] = useState({ stories: 0, views: 0, comments: 0, chapters: 0 });

  useEffect(() => {
    getGlobalStats().then(setStats);
  }, []);

  const cards = [
    { 
      title: "Tổng tác phẩm", 
      value: stats.stories, 
      icon: Book, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      description: "Số lượng truyện đã tạo" 
    },
    { 
      title: "Tổng lượt đọc", 
      value: stats.views > 1000 ? (stats.views/1000).toFixed(1) + 'k' : stats.views, 
      icon: TrendingUp, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      description: "Tích lũy từ tất cả chương" 
    },
    { 
      title: "Bình luận", 
      value: stats.comments, 
      icon: MessageSquare, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10",
      description: "Phản hồi từ độc giả" 
    },
    { 
      title: "Tổng số chương", 
      value: stats.chapters, 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      description: "Nội dung đã xuất bản" 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="group relative overflow-hidden border-none shadow-2xl shadow-black/[0.03] rounded-[2.5rem] bg-background/50 backdrop-blur-md hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-16 h-16 ${card.bg} ${card.color} rounded-[1.75rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{card.description}</span>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">{card.title}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter">{card.value}</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
