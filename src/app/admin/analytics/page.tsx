import { BarChart3, TrendingUp, Users, Eye, ArrowUpRight, MousePointerClick, Calendar, Filter, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsChart } from "../components/AnalyticsChart";
import { getGlobalStats } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export default async function AdminAnalyticsPage() {
  const stats = await getGlobalStats();

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">Phân tích chuyên sâu</h1>
          <p className="text-muted-foreground font-black text-sm uppercase tracking-[0.3em]">
            Theo dõi sự tăng trưởng và hành vi của độc giả trên toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-6 border-2 border-border/50 gap-2">
            <Calendar className="w-4 h-4" /> 30 Ngày qua
          </Button>
          <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-6 border-2 border-border/50 gap-2">
            <Filter className="w-4 h-4" /> Lọc truyện
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Tổng lượt xem", value: stats.views.toLocaleString(), icon: Eye, color: "text-blue-500", trend: "+12.5%" },
          { label: "Số lượng chương", value: stats.chapters.toLocaleString(), icon: TrendingUp, color: "text-emerald-500", trend: "+8.2%" },
          { label: "Bình luận mới", value: stats.comments.toLocaleString(), icon: MessageCircle, color: "text-orange-500", trend: "+15.0%" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-[2.5rem] border-none shadow-2xl shadow-black/[0.03] bg-background/50 backdrop-blur-md group hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center ${stat.color} group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg shadow-black/[0.02]`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/10">
                  <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Growth Chart */}
      <div className="grid grid-cols-1 gap-8">
        <AnalyticsChart />
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/[0.03] bg-background/50 backdrop-blur-md p-8">
          <CardHeader className="px-0 pt-0 pb-8 border-b border-border/30 mb-8">
            <CardTitle className="text-xl font-black tracking-tight">Tác phẩm tiềm năng</CardTitle>
          </CardHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Sắp có dữ liệu chi tiết</p>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/[0.03] bg-background/50 backdrop-blur-md p-8">
          <CardHeader className="px-0 pt-0 pb-8 border-b border-border/30 mb-8">
            <CardTitle className="text-xl font-black tracking-tight">Tương tác theo giờ</CardTitle>
          </CardHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Hệ thống đang tổng hợp</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { MessageCircle } from "lucide-react";
