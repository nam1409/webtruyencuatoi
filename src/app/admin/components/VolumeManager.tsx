"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, GripVertical, Loader2, Layers, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getVolumesByStory, createVolume, updateVolume, deleteVolume, reorderVolumes } from "@/actions/volumes";

interface VolumeManagerProps {
  storyId: string;
}

export function VolumeManager({ storyId }: VolumeManagerProps) {
  const [volumes, setVolumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const loadVolumes = async () => {
    setIsLoading(true);
    try {
      const data = await getVolumesByStory(storyId);
      setVolumes(data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách tập");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVolumes();
  }, [storyId]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createVolume(storyId, newTitle);
      setNewTitle("");
      setIsAdding(false);
      toast.success("Đã thêm tập mới");
      loadVolumes();
    } catch (error) {
      toast.error("Không thể thêm tập");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateVolume(id, storyId, editTitle);
      setEditingId(null);
      toast.success("Đã cập nhật tên tập");
      loadVolumes();
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tập này? Các chương bên trong sẽ không bị xóa nhưng sẽ không còn thuộc tập này.")) return;
    try {
      await deleteVolume(id, storyId);
      toast.success("Đã xóa tập");
      loadVolumes();
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Đang tải cấu trúc tập...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground/70">Quản lý Tập truyện</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Phân chia chương hồi theo từng tập (Volume)</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAdding(true)}
          className="rounded-xl font-bold gap-2 border-dashed border-2"
        >
          <Plus className="w-4 h-4" /> Thêm Tập mới
        </Button>
      </div>

      <div className="grid gap-4">
        {isAdding && (
          <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Tạo tập mới</h4>
            <div className="flex gap-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Tập 1: Khởi đầu..."
                className="rounded-xl bg-background border-none h-11"
              />
              <Button onClick={handleAdd} className="rounded-xl px-6 font-bold">Thêm</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl"><X className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {volumes.length === 0 && !isAdding ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border/50">
            <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Chưa có tập truyện nào được tạo</p>
          </div>
        ) : (
          volumes.map((volume) => (
            <div 
              key={volume.id} 
              className="flex items-center justify-between p-5 bg-background border border-border/50 rounded-[2rem] hover:shadow-xl hover:shadow-black/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                
                {editingId === volume.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="rounded-lg h-9 border-primary/20"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(volume.id)} className="text-green-500"><Check className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-black text-foreground/80">{volume.title}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Thứ tự: {volume.order_index}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 mr-2 px-2 border-r border-border/50">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={async () => {
                      try {
                        await reorderVolumes(storyId, volume.id, 'up');
                        loadVolumes();
                      } catch (error) {
                        toast.error("Lỗi khi sắp xếp");
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-primary/10 text-primary"
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={async () => {
                      try {
                        await reorderVolumes(storyId, volume.id, 'down');
                        loadVolumes();
                      } catch (error) {
                        toast.error("Lỗi khi sắp xếp");
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-primary/10 text-primary"
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => { setEditingId(volume.id); setEditTitle(volume.title); }}
                  className="rounded-xl hover:bg-primary/10 hover:text-primary"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete(volume.id)}
                  className="rounded-xl hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
