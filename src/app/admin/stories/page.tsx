import { getStories } from "@/actions/stories";
import { StoryList } from "../components/StoryList";
import { Plus, BookOpen, Search, Filter, SortAsc } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EpubImportDialog } from "../components/EpubImportDialog";

export default async function AdminStoriesPage() {
  const stories = await getStories();

  return (
    <div className="py-12 px-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Quản lý tác phẩm</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg italic">
            Tổng cộng {stories.length} tác phẩm đang được xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <EpubImportDialog />
          <Link href="/admin/stories/new">
            <Button className="rounded-2xl font-black uppercase tracking-widest h-14 px-8 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Plus className="mr-2 w-5 h-5" /> Viết truyện mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm tác phẩm..." 
              className="pl-12 rounded-xl bg-muted/30 border-none font-bold"
            />
          </div>
          <Button variant="outline" className="rounded-xl font-bold border-2"><Filter className="w-4 h-4 mr-2" /> Lọc</Button>
          <Button variant="outline" className="rounded-xl font-bold border-2"><SortAsc className="w-4 h-4 mr-2" /> Sắp xếp</Button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="space-y-6">
        <StoryList stories={stories} />
      </div>
    </div>
  );
}
