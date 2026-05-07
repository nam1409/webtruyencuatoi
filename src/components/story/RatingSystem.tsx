"use client";

import { useState, useEffect } from "react";
import { Star, StarHalf, Loader2 } from "lucide-react";
import { rateStory, getUserRating, getStoryRating } from "@/actions/ratings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RatingSystemProps {
  storyId: string;
  initialRating?: { average: number; count: number };
  userId?: string;
}

export function RatingSystem({ storyId, initialRating = { average: 0, count: 0 }, userId }: RatingSystemProps) {
  const [rating, setRating] = useState(initialRating);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userId) {
      getUserRating(storyId).then(data => {
        if (data) setUserRating(data.rating);
      });
    }
  }, [storyId, userId]);

  const handleRate = async (value: number) => {
    if (!userId) {
      toast.error("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    setIsSubmitting(true);
    try {
      await rateStory(storyId, value);
      setUserRating(value);
      
      // Update overall rating
      const newRating = await getStoryRating(storyId);
      setRating(newRating);
      
      toast.success("Cảm ơn bạn đã đánh giá!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center md:items-start gap-4">
      <div className="flex items-center gap-4">
        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => handleRate(star)}
              disabled={isSubmitting}
              className={`transition-all duration-200 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-125'}`}
            >
              <Star
                className={`w-6 h-6 ${
                  (hoverRating || userRating || 0) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">{rating.average}</span>
            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">/ 5</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
            {rating.count} đánh giá
          </p>
        </div>
      </div>

      {userRating && (
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">
          Bạn đã đánh giá {userRating} sao
        </p>
      )}
    </div>
  );
}
