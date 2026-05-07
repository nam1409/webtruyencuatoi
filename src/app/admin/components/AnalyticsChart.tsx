"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AnalyticsChart() {
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [trend, setTrend] = useState("0");

  useEffect(() => {
    setMounted(true);
    const fetchAnalytics = async () => {
      const supabase = createClient();
      const { data: views, error } = await supabase.rpc('get_global_analytics', { 
        days_back: 30 
      });

      if (views && !error) {
        const chartData = views.map((v: any) => ({
          name: new Date(v.view_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
          views: v.total_views
        }));
        setData(chartData);

        // Calculate actual trend if we have at least 2 days of data
        if (views.length >= 2) {
          const last = views[views.length - 1].total_views;
          const prev = views[views.length - 2].total_views;
          if (prev > 0) {
            const diff = ((last - prev) / prev) * 100;
            setTrend(diff.toFixed(1));
          }
        }
      }
    };

    fetchAnalytics();
  }, []);


  return (
    <Card className="border-none shadow-2xl shadow-black/[0.03] rounded-[2.5rem] bg-background/50 backdrop-blur-md overflow-hidden h-full">
      <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">Tăng trưởng lượt đọc</CardTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">30 ngày gần nhất</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl">
          <TrendingUp className={`w-4 h-4 ${Number(trend) >= 0 ? "text-emerald-500" : "text-destructive"}`} />
          <span className={`text-xs font-black ${Number(trend) >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {Number(trend) >= 0 ? "+" : ""}{trend}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-12">
        <div className="h-[400px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    fontWeight: 800
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/20" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
