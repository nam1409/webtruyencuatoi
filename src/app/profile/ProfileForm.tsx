"use client";

import { useState } from "react";
import { User, Globe, FileText, Camera, Save, Loader2, Sparkles, ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { motion } from "framer-motion";

interface ProfileFormProps {
  initialProfile: any;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile({
      display_name: formData.get("display_name") as string,
      bio: formData.get("bio") as string,
      website: formData.get("website") as string,
      avatar_url: profile?.avatar_url
    });

    if (result.success) {
      toast.success("Hồ sơ đã được cập nhật!");
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
    setSaving(false);
  }

  const generateNewAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${newSeed}`;
    setProfile({ ...profile, avatar_url: newAvatar });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
            <UserCircle className="w-4 h-4" />
            Account Space
          </div>
          <h1 className="text-5xl font-black tracking-tighter">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground font-medium text-lg italic">Chào mừng quay trở lại, {profile?.display_name || 'bạn hiền'}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-2xl bg-background/40 backdrop-blur-2xl overflow-hidden group">
            <div className="h-32 bg-gradient-to-br from-primary/30 via-purple-500/20 to-transparent" />
            <CardContent className="relative pt-0 pb-10 text-center">
              <div className="relative -mt-16 mb-6 inline-block group/avatar">
                <div className="w-32 h-32 rounded-[2.5rem] bg-background border-8 border-background shadow-2xl overflow-hidden relative transition-transform duration-500 group-hover/avatar:scale-105">
                  <img src={profile?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  <button 
                    onClick={generateNewAvatar}
                    className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/40 border-4 border-background animate-bounce">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black tracking-tight mb-1">{profile?.display_name || "Chưa đặt tên"}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-8 italic">Member since 2026</p>
              
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Quyền: {profile?.role || 'reader'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-2xl bg-background/40 backdrop-blur-2xl">
            <CardHeader className="pb-8 border-b border-border/50 mb-8">
              <CardTitle className="text-2xl font-black tracking-tight">Cài đặt danh tính</CardTitle>
              <CardDescription className="font-medium text-base">Cập nhật thông tin để cộng đồng nhận ra bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Bút danh / Tên hiển thị
                    </label>
                    <Input 
                      name="display_name"
                      defaultValue={profile?.display_name}
                      placeholder="Nhập tên bạn muốn hiện..."
                      className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-lg px-6"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      Website (Nếu có)
                    </label>
                    <Input 
                      name="website"
                      defaultValue={profile?.website}
                      placeholder="https://yourlink.com"
                      className="h-14 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-medium px-6"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Giới thiệu bản thân
                  </label>
                  <Textarea 
                    name="bio"
                    defaultValue={profile?.bio}
                    placeholder="Viết vài dòng tâm đắc về bản thân bạn..."
                    className="min-h-[150px] rounded-3xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary font-medium p-6 resize-none text-base"
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group"
                  >
                    {saving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                        Lưu thay đổi hồ sơ
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
