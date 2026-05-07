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
      try {
        const id = chapterId || storyId;
        const type = chapterId ? "chapter" : "story";
        if (!id) return;

        // 1. Get or Create Viewer ID
        let viewerId = localStorage.getItem("zen_viewer_id");
        if (!viewerId) {
          viewerId = crypto.randomUUID();
          localStorage.setItem("zen_viewer_id", viewerId);
        }

        // 2. Check View History
        const storageKey = `zen_view_history_${type}`;
        const viewHistoryRaw = localStorage.getItem(storageKey);
        const viewHistory: Record<string, number> = viewHistoryRaw ? JSON.parse(viewHistoryRaw) : {};
        
        const lastView = viewHistory[id];
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (lastView && (now - lastView < TWENTY_FOUR_HOURS)) {
          return;
        }

        const supabase = createClient();
        
        const { error } = await supabase.rpc(
          chapterId ? 'increment_view_count' : 'increment_story_view', 
          chapterId ? { target_chapter_id: id } : { target_story_id: id }
        );
        
        if (!error) {
          viewHistory[id] = now;
          localStorage.setItem(storageKey, JSON.stringify(viewHistory));
        }
      } catch (e) {
        // Silent error to not disturb the user experience
      }
    };

    incrementView();
  }, [chapterId || "", storyId || ""]);

  return null;
}
