import Link from "next/link";
import { BookOpen, PenTool, Zap, Shield, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/70 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs">ZS</div>
            ZenStory
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/truyen" className="text-sm font-medium hover:text-primary transition-colors">Khám phá</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/admin">
                <Button variant="outline" className="rounded-xl border-primary text-primary font-bold">
                  Bảng điều khiển
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-xl font-bold">Bắt đầu viết</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
              <Zap className="w-3 h-3" />
              PHIÊN BẢN ELITE 2026 ĐÃ SẴN SÀNG
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 max-w-4xl mx-auto leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
              Nơi Những <span className="text-primary italic">Câu Chuyện</span> Tìm Thấy Nhà
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              ZenStory là nền tảng xuất bản truyện chữ cao cấp dành cho tác giả độc lập. Tối ưu SEO, bảo mật nội dung và trải nghiệm đọc tuyệt vời.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20">
                Khám phá thư viện
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold border-2">
                Tự xây dựng website
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Stories Grid */}
        <section className="py-20 bg-accent/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">Truyện Nổi Bật</h2>
                <p className="text-muted-foreground">Những tác phẩm được yêu thích nhất tuần qua</p>
              </div>
              <Button variant="ghost" className="group">
                Xem tất cả
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group relative bg-background rounded-3xl overflow-hidden border border-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-white text-[10px] font-black uppercase flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      4.9 Rating
                    </div>
                    {/* Placeholder for story cover */}
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-4xl font-serif italic text-primary/40">
                      Chapter {i}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase">Tiên hiệp</span>
                      <span className="text-[10px] font-bold px-2 py-1 bg-muted text-muted-foreground rounded-md uppercase">Đang ra</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Tiên Nghịch (Xian Ni) - Phần {i}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                      Trong một ngôi làng nhỏ hẻo lánh phía Bắc Triệu quốc, có một thiếu niên tên là Vương Lâm...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted" />
                        <span className="text-xs font-medium">Nhĩ Căn</span>
                      </div>
                      <Link href="/truyen/tien-nghich/chuong-1">
                        <Button size="sm" variant="secondary" className="rounded-xl">Đọc ngay</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Bảo vệ nội dung</h3>
                <p className="text-muted-foreground">Tích hợp các công cụ chống copy, chặn chuột phải và watermark thông minh cho tác giả.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Trải nghiệm đọc Elite</h3>
                <p className="text-muted-foreground">Hệ thống theme đa dạng, typography tùy chỉnh và chế độ OLED bảo vệ mắt độc giả.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Viết lách chuyên nghiệp</h3>
                <p className="text-muted-foreground">Trình soạn thảo Tiptap hiện đại, tự động lưu nháp và quản lý phiên bản lịch sử.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border bg-accent/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 ZenStory Platform. Được xây dựng cho cộng đồng tác giả Light Novel Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
