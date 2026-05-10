import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

export async function uploadBrandingAsset(file: File, path: string) {
  const supabase = createClient();
  
  try {
    // 1. Nén ảnh và chuyển sang WebP để tối ưu dựa trên loại asset
    let maxWidthOrHeight = 1024;
    let maxSizeMB = 0.5;

    if (path === 'favicon') {
      maxWidthOrHeight = 64;
      maxSizeMB = 0.05; // 50KB cho favicon là quá đủ
    } else if (path === 'apple-icon') {
      maxWidthOrHeight = 180;
      maxSizeMB = 0.1; // 100KB cho apple icon
    }

    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
      fileType: "image/webp" as string
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // 2. Upload lên bucket 'assets' (Bạn hãy tạo bucket này trong Supabase)
    const fileExt = "webp";
    const fileName = `${path}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    const { data, error } = await supabase.storage
      .from("assets")
      .upload(filePath, compressedFile, {
        upsert: true,
        contentType: "image/webp"
      });

    if (error) throw error;

    // 3. Trả về URL công khai
    const { data: { publicUrl } } = supabase.storage
      .from("assets")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
