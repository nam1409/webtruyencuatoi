"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import {TextStyle} from "@tiptap/extension-text-style";
import { 
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo, 
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Eraser, Heading2, Heading3, Underline as UnderlineIcon,
  Highlighter as HighlightIcon, EyeOff, Play, Palette, Code
} from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { useRef, useState, useEffect } from "react";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { Spoiler, ParagraphId } from "@/features/editor/components/extensions";
import { ZenEmbed } from "@/features/editor/components/ZenEmbedExtension";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

interface AdminTiptapEditorProps {
  content: string;
  onChange: (json: any) => void;
  onHtmlChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminTiptapEditor({ content, onChange, onHtmlChange, placeholder, className }: AdminTiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-2xl border border-border/50 shadow-lg my-8 max-w-full h-auto mx-auto",
        },
      }),
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Spoiler,
      ParagraphId,
      ZenEmbed,
      Placeholder.configure({
        placeholder: placeholder || "Bắt đầu nhập nội dung...",
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
      setHtmlContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[300px] p-8 bg-muted/20 rounded-[2rem] border border-border/30",
      },
    },
    immediatelyRender: false,
  });

  // Initialize HTML content
  useEffect(() => {
    if (editor && !htmlContent) {
      setHtmlContent(editor.getHTML());
    }
  }, [editor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error("Lỗi khi tải ảnh");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Sync back to editor
      editor?.commands.setContent(htmlContent);
    } else {
      // Sync from editor
      setHtmlContent(editor?.getHTML() || "");
    }
    setIsHtmlMode(!isHtmlMode);
  };

  if (!editor) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/50 rounded-2xl border border-border/30 shadow-sm">
        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 2 }) ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Tiêu đề 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 3 }) ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Tiêu đề 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("bold") ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="In đậm"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("italic") ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="In nghiêng"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("underline") ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Gạch chân"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "left" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Căn trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "center" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Căn giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "right" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Căn phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isHtmlMode}
            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all disabled:opacity-30"
            title="Chèn ảnh"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowEmbedDialog(true)}
            disabled={isHtmlMode}
            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all disabled:opacity-30"
            title="Chèn Video/Map"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkUrl(editor.getAttributes("link").href || "");
              setShowLinkDialog(true);
            }}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("link") ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Chèn link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("highlight") ? "bg-yellow-400 text-yellow-900 shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Tô màu nền"
          >
            <HighlightIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSpoiler().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg transition-all ${editor.isActive("spoiler") ? "bg-red-500 text-white shadow-md" : "text-muted-foreground hover:bg-background disabled:opacity-30"}`}
            title="Spoiler"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <button
          type="button"
          onClick={toggleHtmlMode}
          className={`p-2 rounded-xl transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isHtmlMode ? "bg-purple-600 text-white shadow-lg" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
        >
          <Code className="w-4 h-4" />
          {isHtmlMode ? "Visual Mode" : "Source Code"}
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || isHtmlMode}
            className="p-2 rounded-lg hover:bg-background disabled:opacity-20 text-muted-foreground"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || isHtmlMode}
            className="p-2 rounded-lg hover:bg-background disabled:opacity-20 text-muted-foreground"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      
      {isHtmlMode ? (
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full min-h-[400px] p-8 bg-zinc-950 text-zinc-100 font-mono text-sm rounded-[2rem] border border-border/30 focus:outline-none focus:ring-2 ring-primary/20 transition-all resize-y"
          placeholder="Nhập mã HTML tại đây..."
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <PromptDialog
        open={showEmbedDialog}
        onOpenChange={setShowEmbedDialog}
        title="Chèn nội dung nhúng"
        description="Nhập mã nhúng hoặc URL của video (YouTube, Vimeo, ...) hoặc bản đồ."
        placeholder="https://www.youtube.com/embed/..."
        onConfirm={(url) => {
          if (url) {
            editor.chain().focus().setEmbed({ src: url }).run();
          }
        }}
        label="URL nội dung nhúng"
      />

      <PromptDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        title="Chèn liên kết"
        description="Nhập địa chỉ URL cho liên kết này."
        placeholder="https://..."
        defaultValue={linkUrl}
        onConfirm={(url) => {
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
          } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }
        }}
        label="URL liên kết"
      />
    </div>
  );
}
