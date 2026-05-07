"use client";

import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";

interface StoryStatsProps {
  analytics: any[];
  totalViews: number;
}

export function StoryStats({ analytics, totalViews }: StoryStatsProps) {
  const maxViews = Math.max(...analytics.map(d => d.view_count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Views Card */}
      <div className="bg-muted/20 rounded-[2rem] p-8 border border-border/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Tổng lượt đọc</h4>
        <div className="text-4xl font-black tracking-tight">{totalViews.toLocaleString()}</div>
        <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +0% tuần này
        </p>
      </div>

      {/* Daily Chart Card */}
      <div className="md:col-span-2 bg-muted/20 rounded-[2rem] p-8 border border-border/50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Biểu đồ 30 ngày qua
          </h4>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">Live Analytics</span>
        </div>
        
        <div className="flex-1 flex items-end gap-1 h-32">
          {analytics.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">
              Chưa có dữ liệu thống kê
            </div>
          ) : (
            analytics.map((day, i) => (
              <div 
                key={i}
                className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors relative group"
                style={{ height: `${(day.view_count / maxViews) * 100}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-[8px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {day.view_count} lượt - {new Date(day.view_date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
