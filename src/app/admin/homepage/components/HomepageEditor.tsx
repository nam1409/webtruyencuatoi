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
  Tag,
  Megaphone,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { updateHomepageLayout } from "@/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminTiptapEditor } from "@/features/editor/components/AdminTiptapEditor";


import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LayoutSection {
  id: string;
  type: "hero" | "latest" | "popular" | "trending" | "custom" | "genres" | "news" | "shoutbox" | "stats";
  enabled: boolean;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  limit?: number;
  content?: any;
  settings?: {
    animation?: "none" | "fade" | "slide-up" | "zoom" | "float";
    background?: "default" | "glass" | "gradient" | "dark";
    borderRadius?: "none" | "xl" | "3xl";
  };
}

export function HomepageEditor({ initialLayout }: { initialLayout: LayoutSection[] }) {
  // ... existing state and handlers ...
  const [layout, setLayout] = useState<LayoutSection[]>(initialLayout.map(s => ({
    ...s,
    settings: s.settings || { animation: "fade", background: "default", borderRadius: "xl" }
  })));
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung mới của bạn ở đây...' }] }] },
      settings: { animation: "fade", background: "default", borderRadius: "xl" }
    };
    setLayout([...layout, newSection]);
  };

  const deleteSection = (id: string) => {
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
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border/50 sticky top-4 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-black uppercase tracking-tighter text-muted-foreground">ZenBuilder Pro <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-2">Visual Edit</span></span>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-bold"
        >
          {isSaving ? "Đang lưu..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu cấu hình
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layout.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {layout.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                updateSection={updateSection}
                toggleSection={toggleSection}
                deleteSection={deleteSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="pt-8 border-t border-dashed">
        <Button
          onClick={addSection}
          variant="outline"
          className="w-full border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 py-12 rounded-[2rem] group transition-all duration-500"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <span className="font-black text-primary uppercase tracking-widest text-xs block">Thêm khu vực mới</span>
              <span className="text-[10px] text-muted-foreground font-medium">Chèn thêm các phân đoạn nội dung tùy chỉnh hoặc hệ thống.</span>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}

function SortableSection({
  section,
  updateSection,
  toggleSection,
  deleteSection
}: {
  section: LayoutSection;
  updateSection: (id: string, updates: Partial<LayoutSection>) => void;
  toggleSection: (id: string) => void;
  deleteSection: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "design">("content");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    position: 'relative' as const,
  };

  const updateSetting = (key: string, value: string) => {
    updateSection(section.id, {
      settings: { ...section.settings, [key]: value }
    });
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50 z-50")}>
      <Card
        className={cn(
          "group border-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden",
          section.enabled ? "border-primary/10 shadow-xl bg-card/50" : "border-muted opacity-40 grayscale-[0.8]",
          isDragging && "ring-4 ring-primary/20 border-primary"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row min-h-[300px]">
            {/* Left Sidebar for Dragging & Tabs */}
            <div className="w-full md:w-16 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 flex md:flex-col items-center py-4 gap-6">
              <div
                {...attributes}
                {...listeners}
                className="p-3 rounded-2xl hover:bg-primary/20 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-all duration-300"
              >
                <GripVertical className="w-6 h-6" />
              </div>

              <div className="flex md:flex-col gap-2">
                <button
                  onClick={() => setActiveTab("content")}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    activeTab === "content" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Settings2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab("design")}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    activeTab === "design" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-auto md:pb-4 flex md:flex-col items-center gap-4 px-4 md:px-0">
                <Switch
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                  className="data-[state=checked]:bg-green-500 scale-90"
                />
                {section.type !== 'hero' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {section.type === 'hero' && <Sparkles className="w-6 h-6" />}
                  {section.type === 'latest' && <Eye className="w-6 h-6" />}
                  {section.type === 'popular' && <Settings2 className="w-6 h-6" />}
                  {section.type === 'trending' && <Zap className="w-6 h-6" />}
                  {section.type === 'custom' && <LayoutTemplate className="w-6 h-6" />}
                  {section.type === 'genres' && <Tag className="w-6 h-6" />}
                  {section.type === 'news' && <Megaphone className="w-6 h-6" />}
                  {section.type === 'shoutbox' && <MessageSquare className="w-6 h-6" />}
                  {section.type === 'stats' && <BarChart3 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight uppercase">{section.type} <span className="text-primary/40">Section</span></h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                      className="text-[10px] font-black uppercase tracking-widest bg-muted/50 border-none rounded-full px-3 py-1 outline-none cursor-pointer hover:bg-muted transition-colors"
                      disabled={section.type === 'hero'}
                    >
                      <option value="latest">Mới cập nhật</option>
                      <option value="popular">Phổ biến</option>
                      <option value="trending">Xu hướng</option>
                      <option value="genres">Thể loại</option>
                      <option value="news">Bảng tin (ZenBoard)</option>
                      <option value="shoutbox">Trò chuyện (Shoutbox)</option>
                      <option value="stats">Thống kê (Stats)</option>
                      <option value="custom">Nội dung tùy chỉnh</option>
                      <option value="hero" disabled>Hero (Mặc định)</option>
                    </select>
                    {activeTab === "design" && <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-600 px-3 py-1 rounded-full">Thiết kế nâng cao</span>}
                  </div>
                </div>
              </div>

              {activeTab === "content" ? (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  {section.type === 'hero' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Tiêu đề chính</Label>
                          <Input
                            value={section.title || ""}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Xin chào..."
                            className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl font-bold text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Mô tả phụ</Label>
                          <Input
                            value={section.subtitle || ""}
                            onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                            placeholder="Chào mừng bạn đến với..."
                            className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Ảnh nền URL</Label>
                        <Input
                          value={section.imageUrl || ""}
                          onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                          placeholder="https://..."
                          className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl"
                        />
                      </div>
                    </div>
                  ) : section.type === 'custom' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Tiêu đề khối</Label>
                        <Input
                          value={section.title || ""}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Nhập tiêu đề cho khu vực này..."
                          className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Trình soạn thảo trực quan</Label>
                        <AdminTiptapEditor
                          content={section.content || { type: 'doc', content: [] }}
                          onChange={(content) => updateSection(section.id, { content })}
                          placeholder="Bắt đầu thiết kế nội dung của bạn..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Tiêu đề khối</Label>
                        <Input
                          value={section.title || ""}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Nhập tiêu đề..."
                          className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Số lượng hiển thị</Label>
                        <Input
                          type="number"
                          value={section.limit || 10}
                          onChange={(e) => updateSection(section.id, { limit: parseInt(e.target.value) })}
                          className="bg-muted/30 border-transparent focus:border-primary/30 h-14 rounded-2xl font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Hiệu ứng xuất hiện</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["none", "fade", "slide-up", "zoom", "float"].map((anim) => (
                          <button
                            key={anim}
                            onClick={() => updateSetting("animation", anim)}
                            className={cn(
                              "px-3 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                              section.settings?.animation === anim
                                ? "border-purple-600 bg-purple-50 text-purple-600 shadow-md"
                                : "border-border/50 hover:border-primary/30"
                            )}
                          >
                            {anim}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Phong cách nền</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["default", "glass", "gradient", "dark"].map((bg) => (
                          <button
                            key={bg}
                            onClick={() => updateSetting("background", bg)}
                            className={cn(
                              "px-3 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                              section.settings?.background === bg
                                ? "border-purple-600 bg-purple-50 text-purple-600 shadow-md"
                                : "border-border/50 hover:border-primary/30"
                            )}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 px-1">Độ bo góc</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {["none", "xl", "3xl"].map((br) => (
                          <button
                            key={br}
                            onClick={() => updateSetting("borderRadius", br)}
                            className={cn(
                              "px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between",
                              section.settings?.borderRadius === br
                                ? "border-purple-600 bg-purple-50 text-purple-600 shadow-md"
                                : "border-border/50 hover:border-primary/30"
                            )}
                          >
                            <span>Radius {br}</span>
                            <div className={cn("w-4 h-4 bg-muted border border-border/50", br === 'xl' && "rounded-md", br === '3xl' && "rounded-xl")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-3xl border border-purple-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-purple-900 uppercase tracking-tighter">Mẹo ZenBuilder</p>
                      <p className="text-[10px] text-purple-700 font-medium">Kết hợp hiệu ứng "Slide Up" với nền "Glass" để tạo cảm giác trang web chiều sâu và hiện đại hơn.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
