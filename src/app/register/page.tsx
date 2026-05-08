"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUp } from "../auth/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Đăng ký thành công! Đang chuyển hướng...");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container max-w-[400px] relative z-10 px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại trang chủ
        </Link>

        <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-black tracking-tighter">Đăng ký tài khoản</CardTitle>
            <CardDescription>Bắt đầu hành trình của bạn ngay hôm nay</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Input name="username" placeholder="Bút danh (Ví dụ: Nhĩ Căn)" className="h-11 rounded-xl bg-muted/30 border-none" required />
              </div>
              <div className="grid gap-2">
                <Input name="email" type="email" placeholder="name@example.com" className="h-11 rounded-xl bg-muted/30 border-none" required />
              </div>
              <div className="grid gap-2">
                <Input name="password" type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" className="h-11 rounded-xl bg-muted/30 border-none" required />
              </div>
              <Button type="submit" className="h-11 rounded-xl font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Đăng nhập</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
