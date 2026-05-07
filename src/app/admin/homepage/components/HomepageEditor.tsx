"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Save, 
  Eye,
  Settings2,
  Sparkles,
  Zap,
  LayoutTemplate,
  Tag
} from "lucide-react";
import { updateHomepageLayout } from "@/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminTiptapEditor } from "@/features/editor/components/AdminTiptapEditor";

interface LayoutSection {
  id: string;
  type: "hero" | "latest" | "popular" | "trending" | "custom" | "genres";
  enabled: boolean;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  limit?: number;
  content?: any;
}

export function HomepageEditor({ initialLayout }: { initialLayout: LayoutSection[] }) {
  const [layout, setLayout] = useState<LayoutSection[]>(initialLayout);
  const [isSaving, setIsSaving] = useState(false);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layout.length) return;

    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setLayout(newLayout);
  };

  const toggleSection = (id: string) => {
    setLayout(layout.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSection = (id: string, updates: Partial<LayoutSection>) => {
    setLayout(layout.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addSection = () => {
    const newSection: LayoutSection = {
      id: Math.random().toString(36).substring(7),
      type: "custom",
      enabled: true,
      title: "Khu vực mới",
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung mới của bạn ở đây...' }] }] }
    };
    setLayout([...layout, newSection]);
  };

  const deleteSection = (id: string) => {
    // Hero should probably not be deletable to avoid breaking the layout
    if (layout.find(s => s.id === id)?.type === 'hero') {
      toast.error("Không thể xóa khu vực Hero mặc định");
      return;
    }
    setLayout(layout.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateHomepageLayout(layout);
      toast.success("Đã cập nhật cấu trúc trang chủ thành công!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật: " + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border/50 sticky top-4 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Chế độ chỉnh sửa trực quan</span>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          {isSaving ? "Đang lưu..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu cấu hình
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {layout.map((section, index) => (
          <Card 
            key={section.id} 
            className={cn(
              "group border-2 transition-all duration-300",
              section.enabled ? "border-primary/20 shadow-sm" : "border-muted opacity-60 grayscale-[0.5]"
            )}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === layout.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {section.type === 'hero' && <Sparkles className="w-4 h-4" />}
                        {section.type === 'latest' && <Eye className="w-4 h-4" />}
                        {section.type === 'popular' && <Settings2 className="w-4 h-4" />}
                        {section.type === 'trending' && <Zap className="w-4 h-4" />}
                        {section.type === 'custom' && <LayoutTemplate className="w-4 h-4" />}
                        {section.type === 'genres' && <Tag className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg capitalize">{section.type} Section</h3>
                        <select 
                          value={section.type}
                          onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                          className="text-[10px] font-black uppercase tracking-widest bg-muted/50 border-none rounded px-2 py-0.5 outline-none cursor-pointer hover:bg-muted"
                          disabled={section.type === 'hero'}
                        >
                          <option value="latest">Mới cập nhật</option>
                          <option value="popular">Phổ biến</option>
                          <option value="trending">Xu hướng</option>
                          <option value="genres">Thể loại</option>
                          <option value="custom">Nội dung tùy chỉnh</option>
                          <option value="hero" disabled>Hero (Mặc định)</option>
                        </select>
                      </div>
                      {!section.enabled && <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground ml-auto">Ẩn</span>}
                    </div>
                  
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {section.type === 'hero' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest font-black opacity-50">Tiêu đề Hero</Label>
                            <Input 
                              value={section.title || ""} 
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              placeholder="Nơi Những Câu Chuyện Tìm Thấy Nhà"
                              className="bg-muted/30 border-transparent focus:border-primary/30"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest font-black opacity-50">Tiêu đề phụ (Subtitle)</Label>
                            <Input 
                              value={section.subtitle || ""} 
                              onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                              placeholder="Mô tả ngắn gọn về website của bạn..."
                              className="bg-muted/30 border-transparent focus:border-primary/30"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest font-black opacity-50">Ảnh nền (Image URL)</Label>
                          <Input 
                            value={section.imageUrl || ""} 
                            onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="bg-muted/30 border-transparent focus:border-primary/30"
                          />
                        </div>
                      </div>
                    ) : section.type === 'custom' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest font-black opacity-50">Nội dung tùy chỉnh (Tiptap)</Label>
                          <AdminTiptapEditor 
                            content={section.content || { type: 'doc', content: [] }} 
                            onChange={(content) => updateSection(section.id, { content })} 
                            placeholder="Nhập nội dung cho phân đoạn này..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest font-black opacity-50">Tiêu đề khu vực</Label>
                          <Input 
                            value={section.title || ""} 
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Nhập tiêu đề..."
                            className="bg-muted/30 border-transparent focus:border-primary/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest font-black opacity-50">Số lượng hiển thị</Label>
                          <Input 
                            type="number"
                            value={section.limit || 10} 
                            onChange={(e) => updateSection(section.id, { limit: parseInt(e.target.value) })}
                            className="bg-muted/30 border-transparent focus:border-primary/30"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 px-4 border-l">
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-[10px] uppercase font-black opacity-40">Hiển thị</Label>
                    <Switch 
                      checked={section.enabled} 
                      onCheckedChange={() => toggleSection(section.id)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  {section.type !== 'hero' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
 
      <div className="pt-8 border-t border-dashed">
        <Button 
          onClick={addSection}
          variant="outline" 
          className="w-full border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 py-8 rounded-2xl group transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-primary/60">Thêm khu vực mới</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
