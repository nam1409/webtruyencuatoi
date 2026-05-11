"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadBrandingAsset } from "@/lib/storage-utils";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface IconUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  path: string;
  description?: string;
  aspectRatio?: string;
}

export function IconUploader({ label, value, onChange, path, description, aspectRatio = "aspect-square" }: IconUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh.");
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadBrandingAsset(file, path);
      onChange(publicUrl);
      toast.success(`Đã tải lên ${label} thành công!`);
    } catch (error: any) {
      toast.error("Lỗi khi tải ảnh lên: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <div 
            className={`relative group h-24 ${aspectRatio === 'aspect-square' ? 'w-24' : 'w-48'} rounded-2xl border-2 border-dashed border-border/50 bg-muted/5 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50`}
          >
            {value ? (
              <>
                <OptimizedImage src={value} className="w-full h-full object-contain p-2" alt={label} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                   <Upload className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              ref={fileInputRef}
            />
          </div>

          <div className="flex-1 space-y-3">
             {description && <p className="text-[10px] text-muted-foreground font-medium italic">{description}</p>}
             <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Thay đổi ảnh
                </Button>
                {value && (
                  <div className="flex items-center gap-1.5 px-3 bg-green-500/10 text-green-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                    <Check className="w-3 h-3" /> Đã lưu
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
