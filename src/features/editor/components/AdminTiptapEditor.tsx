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
  Link as LinkIcon, Eraser, Heading2, Heading3
} from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { PromptDialog } from "@/components/ui/prompt-dialog";

interface AdminTiptapEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
}

export function AdminTiptapEditor({ content, onChange, placeholder }: AdminTiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

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
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[200px] p-6 bg-muted/20 rounded-2xl border border-border/30",
      },
    },
    immediatelyRender: false,
  });

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

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/30">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 2 }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive("heading", { level: 3 }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive("bold") ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive("italic") ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "left" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "center" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded-lg transition-all ${editor.isActive({ textAlign: "right" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setLinkUrl(editor.getAttributes("link").href || "");
            setShowLinkDialog(true);
          }}
          className={`p-2 rounded-lg transition-all ${editor.isActive("link") ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-background disabled:opacity-20 text-muted-foreground"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-background disabled:opacity-20 text-muted-foreground"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <EditorContent editor={editor} />

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
