"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, User, Zap, Book, MessageSquare, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const actionIcons: Record<string, any> = {
  create_story: Book,
  publish_chapter: Zap,
  new_comment: MessageSquare,
  update_settings: Settings,
  default: Activity
};

export function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRecentActivity(8).then((data) => {
      setActivities(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <Card className="border-none shadow-2xl shadow-black/[0.03] rounded-[2.5rem] bg-background/50 backdrop-blur-md h-full">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Hoạt động gần đây</CardTitle>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Real-time Feed</span>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-2xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-8 relative">
            {/* Timeline Line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-border/30" />
            
            {activities.map((log) => {
              const Icon = actionIcons[log.action] || actionIcons.default;
              return (
                <div key={log.id} className="relative flex gap-6 group">
                  <div className="w-12 h-12 bg-background border border-border/50 rounded-2xl flex items-center justify-center shadow-sm z-10 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black tracking-tight text-foreground/80">{log.details || log.action}</p>
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {log.profiles?.display_name || 'Hệ thống'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
