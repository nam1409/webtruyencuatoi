"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Save } from "lucide-react";

interface TiptapEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  isSaving?: boolean;
}

export function TiptapEditor({ initialContent, onChange, isSaving }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg focus:outline-none max-w-none min-h-[500px] p-4 sm:p-8 font-serif",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Editor Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 p-2 bg-muted/50 backdrop-blur-md border-b border-border">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-background transition-colors ${editor.isActive("bold") ? "bg-background text-primary" : ""}`}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-background transition-colors ${editor.isActive("italic") ? "bg-background text-primary" : ""}`}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-background transition-colors ${editor.isActive("bulletList") ? "bg-background text-primary" : ""}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-background transition-colors ${editor.isActive("orderedList") ? "bg-background text-primary" : ""}`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-background transition-colors ${editor.isActive("blockquote") ? "bg-background text-primary" : ""}`}
        >
          <Quote className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-background transition-colors disabled:opacity-30"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-background transition-colors disabled:opacity-30"
        >
          <Redo className="w-5 h-5" />
        </button>

        <div className="ml-auto flex items-center gap-2 pr-2">
          {isSaving ? (
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Đang lưu...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Đã lưu
            </span>
          )}
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
