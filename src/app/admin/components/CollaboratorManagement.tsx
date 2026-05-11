"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Shield, ShieldAlert, Loader2 } from "lucide-react";
import { getCollaborators, addCollaborator, removeCollaborator } from "@/actions/collaborators";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export function CollaboratorManagement({ storyId }: { storyId: string }) {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollaborators = async () => {
    setIsLoading(true);
    const data = await getCollaborators(storyId);
    setCollaborators(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCollaborators();
  }, [storyId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    try {
      await addCollaborator(storyId, username, role);
      setUsername("");
      toast.success(`Đã thêm ${username} làm cộng tác viên`);
      loadCollaborators();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Xóa ${name} khỏi danh sách cộng tác viên?`)) return;

    try {
      await removeCollaborator(id, storyId);
      toast.success(`Đã xóa ${name}`);
      loadCollaborators();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-background rounded-[2.5rem] border border-border/50 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Cộng tác viên</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quản lý quyền biên tập</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Nhập username người dùng..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl h-12 border-muted"
            />
            <Button disabled={isSubmitting} className="rounded-xl h-12 px-8 font-bold gap-2 shrink-0">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Thêm
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 p-1 bg-muted/20 rounded-2xl">
            {[
              { id: 'editor', label: 'Biên tập' },
              { id: 'translator', label: 'Dịch giả' },
              { id: 'proofreader', label: 'Kiểm ngữ' },
              { id: 'moderator', label: 'Điều phối' },
              { id: 'admin', label: 'Quản trị' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  role === r.id 
                  ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' 
                  : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </form>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-center py-8 text-xs font-medium text-muted-foreground italic">Chưa có cộng tác viên nào.</p>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border/50">
                    <OptimizedImage alt={collab.profiles?.display_name || collab.profiles?.username} src={collab.profiles?.avatar_url} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{collab.profiles?.display_name || collab.profiles?.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Shield className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                        {collab.role === 'translator' ? 'Dịch giả' : 
                         collab.role === 'proofreader' ? 'Kiểm ngữ' : 
                         collab.role === 'editor' ? 'Biên tập' : 
                         collab.role === 'moderator' ? 'Điều phối' : 
                         collab.role === 'admin' ? 'Quản trị' : collab.role}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(collab.id, collab.profiles?.display_name || collab.profiles?.username)}
                  className="p-2.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
