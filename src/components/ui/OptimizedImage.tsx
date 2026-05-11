"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "src" | "priority"> {
  src: string | null | undefined;
  fallbackSrc?: string;
  preload?: boolean;
}

/**
 * Một wrapper thông minh cho Next.js Image
 * - Tự động xử lý ảnh từ Supabase
 * - Tự động xử lý lỗi (fallback)
 * - Tối ưu hóa caching
 */
export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = "/placeholder-cover.jpg", // Bạn có thể đổi ảnh mặc định ở đây
  fill,
  preload,
  sizes,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset error state khi src thay đổi
  useEffect(() => {
    setError(false);
  }, [src]);

  // Nếu không có src hoặc bị lỗi, dùng ảnh fallback
  const imageSrc = !src || error ? fallbackSrc : src;

  // Kiểm tra xem có phải ảnh "nội bộ" (Supabase hoặc local) không
  const isInternal = src?.includes("supabase.co") || src?.startsWith("/") || src?.startsWith("./");
  
  // Nếu không phải nội bộ, chúng ta không cần Next.js tối ưu/cache để tiết kiệm tài nguyên server
  const shouldOptimize = isInternal;

  return (
    <div 
      className={cn(
        "relative overflow-hidden", 
        fill && "w-full h-full",
        loading && "animate-pulse bg-muted",
        className
      )}
      style={!fill ? { width: props.width, height: props.height } : undefined}
    >
      {shouldOptimize ? (
        <Image
          src={imageSrc}
          alt={alt || "ZenStory Image"}
          className={cn(
            "duration-700 ease-in-out",
            loading ? "scale-105 blur-lg" : "scale-100 blur-0",
            className
          )}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          fill={fill || !props.width}
          {...(preload ? { preload: true } : {})}
          sizes={sizes || (fill ? "100vw" : undefined)}
          {...props}
        />
      ) : (
        <img
          src={imageSrc as string}
          alt={alt || "ZenStory Image"}
          className={cn(
            "duration-700 ease-in-out",
            loading ? "scale-105 blur-lg" : "scale-100 blur-0",
            className,
            fill ? "absolute inset-0 w-full h-full object-cover" : ""
          )}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          style={!fill ? { width: props.width, height: props.height } : undefined}
        />
      )}
    </div>
  );
}
