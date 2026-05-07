"use client";

import { useEffect } from "react";

import { toast } from "sonner";

export function useContentProtection(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const notify = () => {
      toast.warning("Nội dung đã được bảo vệ bản quyền. Vui lòng không sao chép!", {
        duration: 2000,
        position: "top-center"
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      notify();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+P, Ctrl+S
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 80 || e.keyCode === 83)) ||
        (e.metaKey && (e.keyCode === 80 || e.keyCode === 83)) // MacOS Support
      ) {
        e.preventDefault();
        notify();
        return false;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      notify();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add CSS to disable selection
    const style = document.createElement('style');
    style.id = 'content-protection-styles';
    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      ::selection { background: transparent !important; color: inherit !important; }
    `;
    document.head.appendChild(style);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      const existingStyle = document.getElementById('content-protection-styles');
      if (existingStyle) existingStyle.remove();
      
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [enabled]);
}
