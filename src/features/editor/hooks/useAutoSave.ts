"use client";

import { useState, useEffect, useCallback } from "react";

export function useAutoSave(content: any, onSave: (content: any) => Promise<void>, delay = 2000) {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!content) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(content);
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [content, onSave, delay]);

  return { isSaving };
}
