"use client";

import Link from "next/link";
import { Book, ChevronRight, Clock, Eye, MessageSquare, MoreVertical, Settings, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { deleteStory } from "@/actions/stories";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface StoryListProps {
  stories: any[];
}

export function StoryList({ stories }: StoryListProps) {
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa truyện này? Mọi chương và bình luận sẽ bị mất vĩnh viễn.")) {
      try {
        await deleteStory(id);
        toast.success("Đã xóa truyện thành công");
      } catch (error) {
        toast.error("Lỗi khi xóa truyện");
      }
    }
  };

  if (stories.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-accent/20 overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
            <Book className="w-10 h-10 opacity-20" />
          </div>
          <h3 className="text-xl font-bold text-foreground/70 mb-2">Chưa có tác phẩm nào</h3>
          <p className="max-w-[280px] text-center text-sm leading-relaxed opacity-60">
            Hành trình vạn dặm bắt đầu từ bước chân đầu tiên. Hãy bắt đầu sáng tạo ngay!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {stories.map((story) => (
        <Card 
          key={story.id} 
          className="group relative rounded-3xl border-none shadow-md hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
              <div className="relative w-full sm:w-24 h-32 bg-muted rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                {story.cover_url ? (
                  <OptimizedImage src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors mb-1">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(story.updated_at), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {story.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[160px]">
                      <Link href={`/admin/stories/${story.id}/settings`}>
                        <DropdownMenuItem className="rounded-xl font-bold text-xs p-3 cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" /> Chỉnh sửa thông tin
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(story.id)}
                        className="rounded-xl font-bold text-xs p-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa truyện
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {story.description || "Chưa có mô tả cho tác phẩm này."}
                </p>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-bold">{story.views_count_total || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-bold">{story.comment_count || 0}</span>
                    </div>
                  </div>
              </div>

              <div className="flex flex-col gap-2 sm:pl-6 sm:border-l border-border/50">
                <Link 
                  href={`/admin/stories/${story.id}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all"
                >
                  Quản lý chương
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  href={`/truyen/${story.slug}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-muted/80 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  Xem trang truyện
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/>
    </svg>
  );
}
