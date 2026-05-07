"use client";

import { useState, useEffect } from "react";
import { Clock, BookOpen, User, ChevronLeft, ChevronRight, Loader2, ShieldCheck, UserPlus, UserMinus, Search } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getStoryReaders, grantStoryAccess, revokeStoryAccess, getStoryAccessList } from "@/actions/stories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReaderListProps {
  initialReaders: any[];
  totalCount: number;
  storyId: string;
  isPrivate?: boolean;
}

export function ReaderList({ initialReaders, totalCount, storyId, isPrivate }: ReaderListProps) {
  const [readers, setReaders] = useState(initialReaders);
  const [accessList, setAccessList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  
  useEffect(() => {
    loadAccessList();
  }, []);

  const loadAccessList = async () => {
    const list = await getStoryAccessList(storyId);
    setAccessList(list);
  };

  const handleGrant = async (username: string) => {
    try {
      await grantStoryAccess(storyId, username);
      toast.success(`Đã cấp quyền cho ${username}`);
      loadAccessList();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await revokeStoryAccess(storyId, userId);
      toast.success("Đã thu hồi quyền truy cập");
      loadAccessList();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await getStoryReaders(storyId, newPage, limit);
      setReaders(result.readers);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Failed to fetch readers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (totalCount === 0) {
    return (
      <div className="py-24 text-center bg-muted/10 rounded-[2.5rem] border border-dashed border-border/40">
        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <User className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-black mb-2 opacity-80">Chưa có độc giả nào</h3>
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest max-w-xs mx-auto">
          Truyện của bạn chưa có lượt đọc nào từ người dùng đã đăng nhập.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {readers.map((reader, index) => (
          <div 
            key={reader.profile?.id || index}
            className="flex items-center justify-between p-6 bg-background rounded-[2rem] border border-border/50 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden border border-border/50 group-hover:scale-105 transition-transform">
                {reader.profile?.avatar_url ? (
                  <img src={reader.profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight text-foreground">
                  {reader.profile?.display_name || reader.profile?.username || "Độc giả ẩn danh"}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(reader.last_read_at), "dd/MM/yyyy", { locale: vi })}
                  </span>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span className="flex items-center gap-1 text-primary">
                    <BookOpen className="w-3 h-3" />
                    {reader.chapters_count} chương
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isPrivate && reader.profile?.username && (
                <button
                  onClick={() => handleGrant(reader.profile.username)}
                  disabled={accessList.some(a => a.user_id === reader.profile.id)}
                  className={`p-2 rounded-xl transition-all ${
                    accessList.some(a => a.user_id === reader.profile.id)
                    ? 'bg-primary/10 text-primary opacity-50 cursor-default'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  title={accessList.some(a => a.user_id === reader.profile.id) ? "Đã có quyền" : "Cấp quyền truy cập"}
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                  Active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t border-border/40">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {isPrivate && (
        <div className="space-y-8 pt-12 border-t border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Danh sách truy cập
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                Quản lý các độc giả có quyền xem truyện riêng tư
              </p>
            </div>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleGrant(searchUsername); setSearchUsername(""); }}
              className="flex gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input 
                  placeholder="Nhập username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="pl-10 h-11 w-[240px] rounded-xl bg-muted/30 border-none font-bold text-sm"
                />
              </div>
              <Button type="submit" className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">
                Mời
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accessList.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background overflow-hidden border border-border/50">
                    <img src={item.profiles?.avatar_url} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tight">{item.profiles?.display_name || item.profiles?.username}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/50">@{item.profiles?.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRevoke(item.user_id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {accessList.length === 0 && (
              <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Chưa có độc giả nào trong danh sách whitelist</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
