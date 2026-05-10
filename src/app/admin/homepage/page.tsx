import { Metadata } from "next";
import { getSiteSettings } from "@/actions/admin";
import { HomepageEditor } from "./components/HomepageEditor";
import { Layout } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quản lý Trang chủ | Admin Dashboard",
};

export default async function AdminHomepagePage() {
  const settings = await getSiteSettings();
  const layout = settings?.homepage_layout || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Layout className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">ZenBuilder</h2>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Cấu hình Trang chủ</h1>
        <p className="text-muted-foreground text-lg">
          Tùy chỉnh bố cục và nội dung hiển thị trên trang chủ của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <HomepageEditor initialLayout={layout} />
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/10 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Hướng dẫn</CardTitle>
              <CardDescription>Cách tùy chỉnh trang chủ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">1</div>
                <p>Sử dụng các nút mũi tên để thay đổi thứ tự hiển thị của các khu vực.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">2</div>
                <p>Bật/tắt các khu vực bằng công tắc gạt.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">3</div>
                <p>Nhấn "Lưu cấu hình" để áp dụng thay đổi ngay lập tức.</p>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <p className="italic text-muted-foreground font-medium">
                  Mẹo: Bạn có thể thay đổi tiêu đề hiển thị để tạo điểm nhấn riêng cho web của mình.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Các loại khu vực</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-bold mb-1">Hero</p>
                <p className="text-muted-foreground">Khu vực nổi bật trên cùng với truyện tiêu điểm.</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-bold mb-1">Latest Updates</p>
                <p className="text-muted-foreground">Danh sách các chương truyện vừa được đăng tải.</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-bold mb-1">Popular Stories</p>
                <p className="text-muted-foreground">Những bộ truyện có lượt xem cao nhất.</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-bold mb-1">Shoutbox</p>
                <p className="text-muted-foreground">Khung chat cộng đồng thời gian thực.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
