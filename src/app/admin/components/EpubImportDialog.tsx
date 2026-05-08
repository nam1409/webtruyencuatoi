"use client";

import { useState, useRef } from "react";
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle, Book, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";
import { toast } from "sonner";
import { createStory } from "@/actions/stories";
import { createChapter } from "@/actions/chapters";
import slugify from "slugify";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

export function EpubImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseEpub = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus("Đang giải nén file EPUB...");

    try {
      const zip = await JSZip.loadAsync(file);
      
      // 1. Find the .opf file
      const containerXml = await zip.file("META-INF/container.xml")?.async("string");
      if (!containerXml) throw new Error("Không tìm thấy container.xml");

      const parser = new DOMParser();
      const containerDoc = parser.parseFromString(containerXml, "text/xml");
      const opfPath = containerDoc.querySelector("rootfile")?.getAttribute("full-path");
      if (!opfPath) throw new Error("Không tìm thấy đường dẫn file .opf");

      const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";
      const opfXml = await zip.file(opfPath)?.async("string");
      if (!opfXml) throw new Error("Không tìm thấy file .opf");

      const opfDoc = parser.parseFromString(opfXml, "text/xml");

      // 2. Extract Metadata
      const title = opfDoc.querySelector("title")?.textContent || "Truyện nhập từ EPUB";
      const author = opfDoc.querySelector("creator")?.textContent || "Ẩn danh";
      const description = opfDoc.querySelector("description")?.textContent || "";
      
      setStatus(`Phát hiện truyện: ${title}`);
      setProgress(10);

      // 3. Create the Story
      const storySlug = slugify(title, { lower: true, strict: true });
      const newStory = await createStory({
        title,
        description,
        slug: storySlug,
        status: "ongoing",
        metadata: { imported_from: "epub", author_name: author }
      });

      // 4. Parse Spine & Manifest
      const manifestItems: Record<string, string> = {};
      opfDoc.querySelectorAll("manifest > item").forEach(item => {
        const id = item.getAttribute("id");
        const href = item.getAttribute("href");
        if (id && href) manifestItems[id] = href;
      });

      const spineItems = Array.from(opfDoc.querySelectorAll("spine > itemref")).map(item => {
        const idref = item.getAttribute("idref");
        return idref ? manifestItems[idref] : null;
      }).filter(Boolean) as string[];

      // 4b. Parse Table of Contents (TOC) for accurate chapter titles
      const tocMap: Record<string, string> = {};
      const tocId = opfDoc.querySelector("spine")?.getAttribute("toc");
      const tocHref = tocId ? manifestItems[tocId] : null;
      
      if (tocHref) {
        const tocXml = await zip.file(opfDir + tocHref)?.async("string");
        if (tocXml) {
          const tocDoc = parser.parseFromString(tocXml, "text/xml");
          // Parse EPUB 2 NCX format
          tocDoc.querySelectorAll("navPoint").forEach(point => {
            const label = point.querySelector("navLabel > text")?.textContent;
            const src = point.querySelector("content")?.getAttribute("src")?.split("#")[0];
            if (label && src) tocMap[src] = label;
          });
        }
      }

      setStatus(`Bắt đầu nhập ${spineItems.length} chương...`);
      
      // 5. Import Chapters
      for (let i = 0; i < spineItems.length; i++) {
        const href = spineItems[i];
        const fullPath = opfDir + href;
        const chapterHtml = await zip.file(fullPath)?.async("string");

        if (chapterHtml) {
          const chapterDoc = parser.parseFromString(chapterHtml, "text/html");
          
          // 1. Extract Title: Use TOC first, then headings, then <title>
          let chapterTitle = tocMap[href] || 
                             chapterDoc.querySelector("h1, h2, h3")?.textContent || 
                             chapterDoc.querySelector("title")?.textContent || 
                             "";
          
          // Clean up title if it matches book title or is empty
          if (chapterTitle === title || !chapterTitle.trim()) {
            chapterTitle = `Chương ${i + 1}`;
          }
          
          const chapterSlug = slugify(chapterTitle, { lower: true, strict: true }) + `-${i + 1}`;
          
          const body = chapterDoc.querySelector("body");
          
          // Clean up redundant headers
          const firstH1 = body?.querySelector("h1, h2");
          if (firstH1 && (firstH1.textContent?.includes(chapterTitle) || chapterTitle.includes(firstH1.textContent || ""))) {
            firstH1.remove();
          }

          const htmlContent = body?.innerHTML || "";
          
          const jsonContent = generateJSON(htmlContent, [
            StarterKit,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
          ]);
          
          await createChapter(newStory.id, chapterTitle, chapterSlug, null, jsonContent, "Auto Import");
        }

        const p = 10 + ((i + 1) / spineItems.length) * 90;
        setProgress(Math.round(p));
        setStatus(`Đang nhập chương ${i + 1}/${spineItems.length}: ${chapterHtml ? 'Xong' : 'Lỗi'}`);
      }

      toast.success("Đã nhập truyện thành công!");
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Đã có lỗi xảy ra khi nhập EPUB");
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest h-12 px-6 border-2 border-dashed gap-2 hover:bg-primary/5 hover:border-primary transition-all">
          <FileUp className="w-5 h-5 text-primary" /> Nhập từ EPUB
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Upload className="w-7 h-7" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight">Nhập truyện từ EPUB</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-base">
              Hệ thống sẽ tự động phân tách các chương và tạo bản thảo mới từ file EPUB của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!isProcessing ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-muted/30 rounded-[2rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4">
                  <FileUp className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-foreground/70">Chọn file .epub để bắt đầu</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-2">Dung lượng tối đa 50MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseEpub(file);
                  }} 
                  className="hidden" 
                  accept=".epub" 
                />
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-primary flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> {status}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 rounded-full bg-muted/50" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl flex items-center gap-3">
                    <Book className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tự động tách chương</span>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl flex items-center gap-3">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Giữ nguyên mục lục</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-muted/30 p-8 flex flex-row gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-xs h-12"
          >
            Hủy bỏ
          </Button>
          {!isProcessing && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20"
            >
              Chọn File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
