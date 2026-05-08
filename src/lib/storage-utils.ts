import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

export async function uploadBrandingAsset(file: File, path: string) {
  const supabase = createClient();
  
  try {
    // 1. Nén ảnh và chuyển sang WebP để tối ưu
    const options = {
      maxSizeMB: 0.5, // Tối đa 500KB cho logo/icon
      maxWidthOrHeight: 1024,
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
