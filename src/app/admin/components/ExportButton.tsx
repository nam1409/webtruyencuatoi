"use client";

import { useState } from "react";
import { Download, Loader2, FileText, Book, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportStoryToEPUB, exportStoryToDOCX } from "@/actions/export";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  storyId: string;
  storyTitle: string;
}

export function ExportButton({ storyId, storyTitle }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const downloadFile = (base64: string, filename: string, type: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async (format: 'epub' | 'docx') => {
    setIsExporting(format);
    try {
      if (format === 'epub') {
        const base64 = await exportStoryToEPUB(storyId);
        downloadFile(base64, `${storyTitle}.epub`, "application/epub+zip");
      } else {
        const base64 = await exportStoryToDOCX(storyId);
        downloadFile(base64, `${storyTitle}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      }
      toast.success(`Đã xuất file ${format.toUpperCase()} thành công!`);
    } catch (error) {
      toast.error("Lỗi khi xuất file");
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!!isExporting}
          className="rounded-xl font-bold gap-2 text-muted-foreground hover:text-primary border-dashed border-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Xuất truyện
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl bg-zinc-900/90 backdrop-blur-xl text-white">
        <DropdownMenuItem 
          onClick={() => handleExport('epub')}
          className="rounded-xl gap-3 py-3 px-4 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-all"
        >
          <Book className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-black text-[11px] uppercase tracking-widest">Định dạng EPUB</span>
            <span className="text-[9px] opacity-60">Dành cho máy đọc sách, điện thoại</span>
          </div>
        </DropdownMenuItem>
        <div className="h-px bg-white/5 my-1" />
        <DropdownMenuItem 
          onClick={() => handleExport('docx')}
          className="rounded-xl gap-3 py-3 px-4 focus:bg-primary focus:text-primary-foreground cursor-pointer transition-all"
        >
          <FileType className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-black text-[11px] uppercase tracking-widest">Định dạng DOCX</span>
            <span className="text-[9px] opacity-60">Dành cho Word, Google Docs</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
