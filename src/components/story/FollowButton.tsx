"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { followStory, unfollowStory, checkFollowStatus } from "@/actions/follows";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  storyId: string;
  userId?: string;
  initialIsFollowing?: boolean;
}

export function FollowButton({ storyId, userId, initialIsFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkFollowStatus(storyId).then(setIsFollowing);
    }
  }, [storyId, userId]);

  const handleFollow = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để theo dõi truyện.");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowStory(storyId);
        setIsFollowing(false);
        toast.success("Đã bỏ theo dõi truyện.");
      } else {
        await followStory(storyId);
        setIsFollowing(true);
        toast.success("Đã theo dõi truyện. Bạn sẽ nhận được thông báo khi có chương mới!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={isFollowing ? "default" : "outline"}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest border-2 gap-2 transition-all duration-500",
        isFollowing 
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 border-primary" 
          : "hover:border-primary hover:text-primary"
      )}
    >
      <Star className={cn("w-5 h-5 transition-transform duration-500", isFollowing && "fill-current scale-125")} />
      {isFollowing ? "Đã theo dõi" : "Theo dõi"}
    </Button>
  );
}
