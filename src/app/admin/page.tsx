"use client";

import Link from "next/link";
import { Plus, Book, MessageSquare, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Bảng điều khiển</h1>
          <p className="text-muted-foreground">Chào mừng tác giả quay trở lại</p>
        </div>
        <Button className="rounded-xl font-bold h-12 px-6 shadow-lg">
          <Plus className="mr-2 w-5 h-5" /> Viết truyện mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Book />} title="Tổng số truyện" value="0" />
        <StatCard icon={<BarChart3 />} title="Lượt xem" value="0" />
        <StatCard icon={<MessageSquare />} title="Bình luận" value="0" />
        <StatCard icon={<Settings />} title="Trạng thái" value="Active" />
      </div>

      <Card className="rounded-3xl border-none shadow-xl bg-accent/20">
        <CardHeader>
          <CardTitle>Truyện của bạn</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Book className="w-16 h-16 mb-4 opacity-20" />
          <p>Bạn chưa có truyện nào. Hãy bắt đầu sáng tạo ngay!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <Card className="border-none shadow-md rounded-2xl">
      <CardContent className="flex items-center p-6 gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
