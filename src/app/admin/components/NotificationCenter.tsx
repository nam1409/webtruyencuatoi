"use client";

import { Bell, Check, Clock, MessageSquare, ShieldAlert, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((n: any) => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "rating": return <Star className="w-4 h-4 text-amber-500" />;
      case "security": return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl bg-background/50 hover:bg-background border border-border/50 w-12 h-12">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-[10px] font-black text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] rounded-[2.5rem] p-4 bg-background/80 backdrop-blur-2xl border-border/40 shadow-2xl mt-2">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30 mb-2">
          <h3 className="font-black text-lg tracking-tight">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 h-8 px-4 rounded-xl"
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả là đã đọc
            </Button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-muted/50 rounded-[1.5rem] flex items-center justify-center mx-auto text-muted-foreground/30">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Không có thông báo mới</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "relative group flex gap-4 p-4 rounded-3xl transition-all duration-300 hover:bg-muted/50",
                  !notification.is_read && "bg-primary/5"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm tracking-tight leading-tight", !notification.is_read ? "font-black" : "font-semibold")}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.content}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                  </div>
                </div>

                {notification.link && (
                  <Link
                    href={notification.link}
                    className="absolute inset-0 z-0"
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  />
                )}

                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-background rounded-lg border border-border/50 hover:bg-primary/10 hover:text-primary z-10"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
