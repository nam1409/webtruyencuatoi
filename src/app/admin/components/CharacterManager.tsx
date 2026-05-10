"use client";

import { useState, useEffect } from "react";
import { Users, Plus, X, ImagePlus, Loader2, User, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCharactersByStory, upsertCharacter, deleteCharacter } from "@/actions/characters";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

interface CharacterManagerProps {
  storyId: string;
}

export function CharacterManager({ storyId }: CharacterManagerProps) {
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, [storyId]);

  const loadCharacters = async () => {
    setIsLoading(true);
    const data = await getCharactersByStory(storyId);
    setCharacters(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setAvatarUrl("");
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (char: any) => {
    setEditingId(char.id);
    setName(char.name);
    setDescription(char.description || "");
    setAvatarUrl(char.avatar_url || "");
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await upsertCharacter({
        id: editingId,
        story_id: storyId,
        name,
        description,
        avatar_url: avatarUrl
      });
      toast.success(editingId ? "Đã cập nhật nhân vật" : "Đã thêm nhân vật mới");
      resetForm();
      loadCharacters();
    } catch (error) {
      toast.error("Lỗi khi lưu nhân vật");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa nhân vật này?")) return;
    try {
      await deleteCharacter(id, storyId);
      toast.success("Đã xóa nhân vật");
      loadCharacters();
    } catch (error) {
      toast.error("Lỗi khi xóa nhân vật");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, "covers"); // Reusing covers bucket for now
      setAvatarUrl(url);
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Lỗi khi tải ảnh");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Danh sách nhân vật
          </h3>
          <p className="text-[10px] font-medium text-muted-foreground">Quản lý nhân vật để tạo tooltip trong nội dung truyện</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest">
            <Plus className="w-4 h-4 mr-2" /> Thêm nhân vật
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-8 bg-muted/20 rounded-[2.5rem] border-2 border-primary/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Button type="button" variant="ghost" size="icon" onClick={resetForm} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-32 space-y-4">
              <div 
                className="w-32 h-32 bg-background rounded-[2rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative shadow-inner group"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground/50">Ảnh đại diện</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImagePlus className="w-6 h-6 text-white" />
                </div>
              </div>
              <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tên nhân vật</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Diệp Phàm"
                  className="h-12 bg-background rounded-xl font-bold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Mô tả ngắn</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Thiên tài luyện đan, main chính của bộ truyện..."
                  className="w-full min-h-[100px] bg-background border border-border/50 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={resetForm} className="rounded-xl font-bold text-xs">Hủy</Button>
                <Button 
                  type="button"
                  disabled={isSubmitting} 
                  onClick={(e) => handleSubmit(e as any)}
                  className="rounded-xl px-8 font-black text-xs uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu nhân vật
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => (
          <div key={char.id} className="p-4 bg-muted/10 rounded-2xl border border-border/50 flex items-center gap-4 group hover:bg-muted/20 transition-all">
            <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden shrink-0 shadow-sm">
              {char.avatar_url ? (
                <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground/30" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black truncate">{char.name}</h4>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{char.description || "Chưa có mô tả."}</p>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(char)} className="w-8 h-8 rounded-lg hover:text-primary">
                <Plus className="w-3.5 h-3.5 rotate-45" /> {/* Use as edit icon variant */}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(char.id)} className="w-8 h-8 rounded-lg hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {characters.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-muted/5 rounded-[2rem] border-2 border-dashed border-border/50">
            <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Chưa có nhân vật nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
