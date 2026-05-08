"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ViewCounterProps {
  chapterId?: string;
  storyId?: string;
}

export function ViewCounter({ chapterId, storyId }: ViewCounterProps) {
  useEffect(() => {
    const incrementView = async () => {
      if (!chapterId && !storyId) return;
      try {
        const { trackView } = await import("@/actions/views");
        await trackView(chapterId || "", storyId || "");
      } catch (e) {
        // Silent error
      }
    };

    incrementView();
  }, [chapterId, storyId]);

  return null;
}
