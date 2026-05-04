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
import { Separator } from "@/components/ui/separator";

import { signIn } from "../auth/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);

    if (result?.error) {
      toast.error("Sai email hoặc mật khẩu!");
      setIsLoading(false);
    } else {
      toast.success("Chào mừng bạn quay trở lại!");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container max-w-[400px] relative z-10 px-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại trang chủ
        </Link>

        <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-black tracking-tighter">ZenStory</CardTitle>
            <CardDescription>
              Chào mừng bạn quay trở lại với thế giới sáng tạo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-11 rounded-xl">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                  <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 .7 5.6-.3 6.9-2.3 .7-2-1.3-4.3-4.3-4.9-2.6-.7-5.6 .3-6.9 2.3zm49.5 3.2c-1.3 2.3-1 4.6 .7 5.2 2 1 4.6-.3 5.9-2.6 1.3-2.3 1-4.6-.7-5.2-2-1-4.6 .3-5.9 2.6zm-48.5-14.5c-1.3 1.3-1 3.9 .7 5.2 2 1.3 4.6 .7 5.9-1 1.3-1.3 1-3.9-.7-5.2-2-1.3-4.6-.7-5.9 1zm39.3-11.7c-1.3 1-1.3 3.3 0 4.6 1.3 1.6 3.9 1.9 5.2 .3 1.3-1.3 1.3-3.3 0-4.6-1.3-1.6-3.9-1.9-5.2-.3zm39.3-3.3c-1.3 0-2.6 1.3-2.3 3.3 .3 2 2 3.3 3.6 3.3 1.6 0 2.6-1.3 2.3-3.3-.3-2-2-3.3-3.6-3.3zm20.3-11.7c-1.6 0-2.6 1.3-2.3 3.3 .3 2 2 3.3 3.6 3.3 1.6 0 2.6-1.3 2.3-3.3-.3-2-2-3.3-3.6-3.3zM448 87.1C448 39.1 408.9 0 360.9 0c-37.5 0-70.5 24.3-82.6 58.1-13.6-2.4-27.4-3.6-41.5-3.6-14.1 0-27.9 1.2-41.5 3.6C183.2 24.3 150.2 0 112.7 0 64.7 0 25.6 39.1 25.6 87.1c0 14.1 3.4 27.2 9.4 38.8-15.5 18.8-24.9 43.1-24.9 69.5 0 20.4 5.6 39.3 15.3 55.4C14.5 272.5 0 302.4 0 334.8c0 48.7 39.1 88.2 87.1 88.2 8.3 0 16.3-1.2 23.9-3.4 21.6 21.4 51.1 34.6 83.8 34.6 11.1 0 21.7-1.5 31.8-4.3 11 2.8 22.6 4.3 34.7 4.3 12.1 0 23.7-1.5 34.7-4.3 10.1 2.8 20.7 4.3 31.8 4.3 32.7 0 62.2-13.2 83.8-34.6 7.6 2.2 15.6 3.4 23.9 3.4 48 0 87.1-39.5 87.1-88.2 0-32.4-14.5-62.3-38.3-83.9 9.7-16.1 15.3-35 15.3-55.4 0-26.4-9.4-50.7-24.9-69.5 6-11.6 9.4-24.7 9.4-38.8z" />
                </svg>
                Github
              </Button>
              <Button variant="outline" className="h-11 rounded-xl">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
                Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc đăng nhập bằng email
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mật khẩu của bạn"
                  className="h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="h-11 rounded-xl font-bold transition-all hover:opacity-90 shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Đăng ký
              </Link>
            </div>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Quên mật khẩu?
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
