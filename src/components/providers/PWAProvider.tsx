"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // In Next.js 16, we want to ensure the SW is registered early
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("ZenStory SW Registered:", registration.scope);
          
          // Ensure the SW updates immediately
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log("New version available, please refresh.");
                }
              };
            }
          };
        } catch (error) {
          console.error("SW Registration Error:", error);
        }
      };

      registerSW();

      // Listen for controlling service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("SW took control of the page");
      });
    }

    // Handle Online/Offline events
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Đã kết nối lại internet. Bạn có thể cập nhật dữ liệu mới nhất.", {
        icon: "🌐"
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Bạn đang ngoại tuyến. Một số chương đã đọc trước đó vẫn có thể khả dụng.", {
        icon: <WifiOff className="w-4 h-4" />,
        duration: Infinity,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Chế độ ngoại tuyến</span>
        </div>
      )}
      {children}
    </>
  );
}
