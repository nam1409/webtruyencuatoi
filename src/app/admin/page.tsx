import { getStories } from "@/actions/stories";
import { StoryList } from "./components/StoryList";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatsCards } from "./components/StatsCards";
import { AnalyticsChart } from "./components/AnalyticsChart";
import { RecentActivity } from "./components/RecentActivity";

export default async function AdminDashboard() {
  const stories = await getStories();

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground">Command Center</h1>
            <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Online</span>
            </div>
          </div>
          <p className="text-muted-foreground font-black text-sm uppercase tracking-[0.3em]">
            Chào mừng tác giả quay trở lại không gian sáng tạo chuyên nghiệp.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/stories/new">
            <Button className="rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] h-14 px-10 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 w-5 h-5" /> Truyện mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Stats */}
      <StatsCards />

      {/* Main Grid: Analytics & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <AnalyticsChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Stories Management Section */}
      <div className="space-y-8 pt-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="font-black text-xl uppercase tracking-tighter text-foreground">Quản lý tác phẩm</h2>
          </div>
          <Link href="/admin/stories" className="text-xs font-black uppercase tracking-widest text-primary hover:underline underline-offset-8">
            Xem tất cả
          </Link>
        </div>
        
        <div className="bg-background/40 backdrop-blur-xl rounded-[3rem] p-1 border border-border/20 shadow-2xl shadow-black/[0.02]">
          <StoryList stories={stories.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
