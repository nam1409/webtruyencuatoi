import { MessageSquare, ShieldCheck, Trash2, CheckCircle, Clock, User, BookOpen, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminComments, approveComment, deleteComment } from "@/actions/comments";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default async function AdminCommentsPage() {
  const comments = await getAdminComments();

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black tracking-tighter text-foreground">Phản hồi & Bình luận</h1>
            <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{comments.length} Tổng số</span>
            </div>
          </div>
          <p className="text-muted-foreground font-black text-sm uppercase tracking-[0.3em]">
            Quản lý tương tác và xây dựng cộng đồng độc giả trung thành.
          </p>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-background/40 backdrop-blur-xl border border-border/20 rounded-[3rem] shadow-2xl text-center px-6">
          <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary/40 mb-8 border border-dashed border-primary/20">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">Hộp thư đang trống</h2>
          <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
            Chưa có bình luận nào từ độc giả. Những phản hồi mới sẽ xuất hiện ngay tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {comments.map((comment: any) => (
            <Card key={comment.id} className="group border-none shadow-xl shadow-black/[0.02] rounded-[2.5rem] bg-background/50 backdrop-blur-md overflow-hidden hover:scale-[1.01] transition-all duration-500">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* User Profile */}
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-2xl overflow-hidden shadow-lg">
                      {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        comment.profiles?.display_name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black tracking-tight truncate">{comment.profiles?.display_name || "Vô danh"}</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                      </div>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 space-y-6">
                    {/* Context Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <BookOpen className="w-3 h-3" />
                        {comment.chapters?.stories?.title}
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {comment.chapters?.title}
                      </div>
                      {comment.paragraph_id && (
                        <span className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black rounded-md border border-primary/10">
                          Inline #{comment.paragraph_id.slice(0, 4)}
                        </span>
                      )}
                    </div>

                    {/* Actual Text */}
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                      <p className="text-base font-medium leading-relaxed text-foreground/90 pl-2 italic">
                        "{comment.content}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
                      {!comment.is_approved && (
                        <form action={async () => {
                          "use server";
                          await approveComment(comment.id);
                        }}>
                          <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-6 border-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 transition-all gap-2">
                            <CheckCircle className="w-4 h-4" /> Phê duyệt
                          </Button>
                        </form>
                      )}
                      
                      <form action={async () => {
                        "use server";
                        await deleteComment(comment.id);
                      }}>
                        <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-6 border-2 border-destructive/20 text-destructive hover:bg-destructive/5 transition-all gap-2">
                          <Trash2 className="w-4 h-4" /> Xóa
                        </Button>
                      </form>
                      
                      <Button className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20 gap-2">
                        <MessageSquare className="w-4 h-4" /> Phản hồi
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
