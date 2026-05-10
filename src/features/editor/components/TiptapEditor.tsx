"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Heading from "@tiptap/extension-heading";

import Blockquote from "@tiptap/extension-blockquote";

import Image from "@tiptap/extension-image";
import Typography from "@tiptap/extension-typography";
import Mention from "@tiptap/extension-mention";
import suggestion from "./suggestion";
import { useEffect, useRef, useState } from "react";
import { TextSelection, NodeSelection } from "@tiptap/pm/state";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import {
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo,
  Image as ImageIcon, Type, Loader2, Sparkles, Plus,
  Heading2, Heading3, Link as LinkIcon, Underline as UnderlineIcon,
  Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Eraser, Baseline, Highlighter, CheckSquare,
  IndentIncrease, IndentDecrease, Type as FontSizeIcon, Maximize, Minimize,
  EyeOff, Info, ChevronDown, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Sigma,
  Play, Film, Wind, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Highlighter as HighlightIcon, 
  Palette, 
  Trash2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  List as ListIconUI
} from "lucide-react";

// Declare custom commands for TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoiler: {
      toggleSpoiler: () => ReturnType,
    },
    annotation: {
      setAnnotation: (note: string) => ReturnType,
      toggleAnnotation: () => ReturnType,
      unsetAnnotation: () => ReturnType,
      updateAnnotation: (note: string) => ReturnType,
    },
    zenEmbed: {
      setEmbed: (options: { src: string, width?: string, height?: string }) => ReturnType,
    }
  }
}
import { uploadImage } from "@/lib/storage";
import { getCharactersByStory } from "@/actions/characters";
import { toast } from "sonner";
import { slashSuggestion } from "./slash-suggestion";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Mathematics } from "@tiptap/extension-mathematics";
import "katex/dist/katex.min.css";
import { NodeId } from "./NodeId";
import { Spoiler, Annotation, FontSize, ZenImage as ZenImageExtension, BlockAnimation } from "./extensions";
import { ZenEmbed } from "./ZenEmbedExtension";
import { mergeAttributes } from "@tiptap/core";

// Custom components will be imported from extensions.ts

const AnnotationMenu = ({ editor }: { editor: any }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localNote, setLocalNote] = useState('');

  // Sync with editor state
  useEffect(() => {
    const note = editor.getAttributes('annotation').note || '';
    setLocalNote(note);

    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [editor.state.selection]);

  const handleChange = (val: string) => {
    setLocalNote(val);
    if (val) {
      (editor.chain() as any).setAnnotation(val).run();
    } else {
      (editor.chain() as any).unsetAnnotation().run();
    }
  };

  return (
    <div className="bg-popover border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex flex-col gap-3 w-80 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 backdrop-blur-xl z-[9999]">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2 text-primary text-sm font-bold">
          <Info className="w-4 h-4" />
          Ghi chú giải thích
        </div>
        <button
          onClick={() => (editor.chain() as any).unsetAnnotation().run()}
          className="p-1 hover:bg-destructive/10 rounded-full text-destructive transition-colors"
          title="Xóa ghi chú"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        className="w-full h-32 p-3 text-sm bg-muted/30 rounded-xl border border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all resize-none placeholder:text-muted-foreground/40 leading-relaxed"
        placeholder="Nhập nội dung giải thích..."
        value={localNote}
        onChange={(e) => handleChange(e.target.value)}
      />

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Tự động lưu bản nháp
        </span>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
          {localNote.length} ký tự
        </span>
      </div>
    </div>
  );
};

const FormattingBubbleMenu = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
      <div className="flex items-center gap-0.5 px-1 border-r border-white/10 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 hover:bg-white/10",
            editor.isActive("bold") ? "text-primary bg-white/10 shadow-inner" : "text-zinc-400"
          )}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 hover:bg-white/10",
            editor.isActive("italic") ? "text-primary bg-white/10 shadow-inner" : "text-zinc-400"
          )}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 hover:bg-white/10",
            editor.isActive("underline") ? "text-primary bg-white/10 shadow-inner" : "text-zinc-400"
          )}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => (editor.commands as any).toggleSpoiler()}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 hover:bg-white/10 flex items-center gap-2 px-3",
            editor.isActive("spoiler") ? "text-amber-400 bg-amber-400/10 shadow-inner" : "text-zinc-400"
          )}
          title="Nội dung Spoiler"
        >
          <EyeOff className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Spoiler</span>
        </button>

        <button
          onClick={() => {
            if (editor.isActive("annotation")) {
              (editor.commands as any).unsetAnnotation();
            } else {
              (editor.commands as any).setAnnotation("");
            }
          }}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 hover:bg-white/10 flex items-center gap-2 px-3",
            editor.isActive("annotation") ? "text-primary bg-primary/10 shadow-inner" : "text-zinc-400"
          )}
          title="Thêm ghi chú"
        >
          <Info className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Ghi chú</span>
        </button>
      </div>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "p-2 rounded-xl transition-all duration-200 hover:bg-white/10 flex items-center gap-2 px-3",
              editor.getAttributes('paragraph').animation || editor.getAttributes('heading').animation 
                ? "text-purple-400 bg-purple-400/10 shadow-inner" 
                : "text-zinc-400"
            )}
            title="Hiệu ứng chuyển động"
          >
            <Film className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hiệu ứng</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-zinc-900 border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 px-3 py-2">Chọn hiệu ứng</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => (editor.commands as any).unsetAnimation()}
            className="rounded-xl py-2 px-3 focus:bg-white/10 text-zinc-400 focus:text-white cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Eraser className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Không có</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          {[
            { id: 'fade', label: 'Hiện dần', icon: Wind },
            { id: 'slide-up', label: 'Trượt lên', icon: ChevronRight },
            { id: 'slide-down', label: 'Trượt xuống', icon: ChevronDown },
            { id: 'zoom-in', label: 'Phóng to', icon: Maximize },
            { id: 'blur-in', label: 'Mờ dần', icon: Zap },
          ].map((anim) => (
            <DropdownMenuItem 
              key={anim.id}
              onClick={() => (editor.commands as any).setAnimation(anim.id)}
              className={cn(
                "rounded-xl py-2 px-3 focus:bg-primary/20 focus:text-primary cursor-pointer mb-1",
                (editor.getAttributes('paragraph').animation === anim.id || editor.getAttributes('heading').animation === anim.id) 
                  ? "bg-primary/10 text-primary" 
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <anim.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{anim.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        title="Xóa định dạng"
      >
        <Eraser className="w-4 h-4" />
      </button>
    </div>
  );
};

const FloatingActionMenu = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 bg-background/80 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl p-1 animate-in fade-in slide-in-from-left-2 duration-300">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-2 pr-3"
      >
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Heading2 className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">H2</span>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-2 pr-3"
      >
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <List className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">List</span>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-2 pr-3"
      >
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Quote className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Quote</span>
      </button>
    </div>
  );
};

interface TiptapEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  onHtmlChange?: (html: string) => void;
  isSaving?: boolean;
  storyId?: string;
  isReadOnly?: boolean;
}

export function TiptapEditor({ initialContent, onChange, onHtmlChange, isSaving, storyId, isReadOnly = false }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  useEffect(() => {
    getCharactersByStory(storyId as string).then(setCharacters);
  }, [storyId]);

  const charactersRef = useRef(characters);

  useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
      }),
      Heading.extend({
        renderHTML({ node, HTMLAttributes }) {
          const level = node.attrs.level;
          const classes: Record<number, string> = {
            1: '!text-5xl !font-black !mb-8 !block',
            2: '!text-4xl !font-bold !mt-12 !mb-6 !block',
            3: '!text-2xl !font-bold !mt-8 !mb-4 !block',
            4: '!text-xl !font-bold !mt-6 !mb-2 !block',
          };
          return [`h${level}`, mergeAttributes(HTMLAttributes, { class: classes[level] || '' }), 0];
        },
      }),
      Blockquote.extend({
        renderHTML({ HTMLAttributes }) {
          return ['blockquote', mergeAttributes(HTMLAttributes, { class: '!border-l-4 !border-primary/30 !pl-6 !italic !my-8 !text-muted-foreground !block' }), 0];
        },
      }),
      Placeholder.configure({
        placeholder: "Bắt đầu viết câu chuyện của bạn...",
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      Typography,
      Underline,
      Spoiler,
      Annotation,
      FontSize,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline decoration-2 underline-offset-4 font-bold",
        },
      }),
      ZenImageExtension,
      ZenEmbed,
      Mention.configure({
        HTMLAttributes: {
          class: "character-mention text-primary font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all",
        },
        suggestion: suggestion(() => charactersRef.current),
      }),
      Mention.extend({
        name: "slashCommand",
      }).configure({
        suggestion: {
          ...slashSuggestion,
          char: "/",
        },
        HTMLAttributes: {
          class: "hidden",
        },
        renderText: () => "",
      }),
      NodeId,
      BlockAnimation,
      Subscript,
      Superscript,
      Mathematics,
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      onChange(json);
      if (onHtmlChange) onHtmlChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[600px] font-serif leading-relaxed selection:bg-primary/20 transition-all duration-500",
          isReadOnly ? "p-4 sm:p-10 opacity-70 cursor-default" : "p-4 sm:p-24"
        ),
      },
    },
    editable: !isReadOnly
  }, []); // Only init once!


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Only set initial content if editor is empty and we have content
  const hasSetInitial = useRef(false);
  useEffect(() => {
    if (editor && initialContent && !hasSetInitial.current) {
      editor.commands.setContent(initialContent);
      hasSetInitial.current = true;
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) {
      (editor as any).openEmbedDialog = () => {
        setEmbedUrl("");
        setShowEmbedDialog(true);
      };
    }
  }, [editor]);

  const handleSetLink = (url: string) => {
    if (url) {
      editor!.chain().focus().setLink({ href: url }).run();
    } else {
      editor!.chain().focus().unsetLink().run();
    }
    setShowLinkDialog(false);
  };

  const handleSetEmbed = (url: string) => {
    if (url && editor) {
      let finalUrl = url;
      
      // Robust YouTube ID extraction
      const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(youtubeRegex);
      
      if (match && match[2].length === 11) {
        const videoId = match[2];
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('<iframe')) {
        // If user pasted a whole iframe, try to extract src
        const srcMatch = url.match(/src=["']([^"']+)["']/);
        if (srcMatch) finalUrl = srcMatch[1];
      }
      
      (editor.commands as any).setEmbed({ src: finalUrl });
    }
    setShowEmbedDialog(false);
    setEmbedUrl("");
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full transition-all duration-500">
      {/* Floating Menu for Blocks */}
      {editor && (
        <FloatingMenu
          editor={editor}
          options={{
            duration: 200,
            placement: 'right',
          } as any}
          shouldShow={({ editor }) => {
            // Only show on empty paragraph lines
            return editor.isActive('paragraph') && editor.state.selection.empty && editor.state.doc.resolve(editor.state.selection.from).parent.content.size === 0;
          }}
        >
          <FloatingActionMenu editor={editor} />
        </FloatingMenu>
      )}

      {/* Annotation Bubble Menu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: 'top'
          }}
          shouldShow={({ editor, from, to }) => {
            return from !== to && editor.isActive('annotation');
          }}
        >
          <AnnotationMenu
            key={`${editor.state.selection.from}-${editor.state.selection.to}`}
            editor={editor}
          />
        </BubbleMenu>
      )}

      {/* Formatting Bubble Menu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: 'top'
          }}
          shouldShow={({ editor, from, to }) => {
            // Only show if it's a TEXT selection and NOT an empty selection
            const isTextSelection = editor.state.selection instanceof TextSelection;
            const isNodeSelection = editor.state.selection instanceof NodeSelection;
            
            return isTextSelection && 
                   from !== to && 
                   !editor.isActive('annotation') && 
                   !isNodeSelection;
          }}
        >
          <FormattingBubbleMenu editor={editor} />
        </BubbleMenu>
      )}

      {/* Editor Toolbar */}
      {!isReadOnly && (
        <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2 p-2 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300">
        {/* Style Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all group">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">
                {editor.isActive("heading", { level: 1 }) ? "Tiêu đề chính" :
                 editor.isActive("heading", { level: 2 }) ? "Tiêu đề chương" :
                 editor.isActive("heading", { level: 3 }) ? "Phân đoạn 1" :
                 editor.isActive("heading", { level: 4 }) ? "Phân đoạn 2" : "Văn bản thường"}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-2xl p-2 shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setParagraph().run()}
              className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Văn bản thường</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-lg">Tiêu đề chính</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-base">Tiêu đề chương</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Phân đoạn 1</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all group">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80">
                Size
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-24 rounded-2xl p-2 shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl h-64 overflow-y-auto custom-scrollbar">
            {['12px', '14px', '16px', '18px', '20px', '24px', '32px'].map((size) => (
              <DropdownMenuItem 
                key={size}
                onClick={() => (editor.commands as any).setFontSize(size)}
                className="rounded-xl py-2 px-3 focus:bg-primary/5 focus:text-primary cursor-pointer"
              >
                <span className="text-[10px] font-black">{size.replace('px', '')}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* Formatting Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("bold") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="In đậm"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("italic") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="In nghiêng"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("underline") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Gạch chân"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("strike") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Gạch ngang"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("subscript") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Chỉ số dưới"
          >
            <SubscriptIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("superscript") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Chỉ số trên"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => (editor.commands as any).toggleMathematics()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("mathematics") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Công thức Toán học (LaTeX)"
          >
            <Sigma className="w-4 h-4" />
          </button>
          <button
            onClick={() => (editor.commands as any).toggleSpoiler()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("spoiler") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Nội dung Spoiler (Ẩn)"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (editor.isActive("annotation")) {
                (editor.commands as any).unsetAnnotation();
              } else {
                (editor.commands as any).setAnnotation("");
              }
            }}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("annotation") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Thêm chú thích nhanh"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Color Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <div className="relative group/color p-2 rounded-lg hover:bg-background transition-all cursor-pointer">
            <Baseline className="w-4 h-4 text-muted-foreground" />
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Màu chữ"
            />
          </div>
          <div className="relative group/color p-2 rounded-lg hover:bg-background transition-all cursor-pointer">
            <Highlighter className="w-4 h-4 text-muted-foreground" />
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Màu nền (Highlight)"
            />
          </div>
        </div>

        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* Alignment Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive({ textAlign: "left" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Căn trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive({ textAlign: "center" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Căn giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive({ textAlign: "right" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Căn phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive({ textAlign: "justify" }) ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Căn đều"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Indent Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => {
              // Custom indent logic: wrap in a div with margin or just use blockquote?
              // Standard way is a bit complex, let's use a simple tab or margin-left if possible
              // For now, let's just add the icons as placeholders or simple indent if extension exists
            }}
            className="p-2 rounded-lg hover:bg-background transition-all text-muted-foreground opacity-30 cursor-not-allowed"
            title="Thụt lề (Sắp có)"
          >
            <IndentIncrease className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* List & Special Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("bulletList") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Danh sách dấu chấm"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("orderedList") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Danh sách đánh số"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("taskList") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Danh sách công việc"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("blockquote") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Trích dẫn"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded-lg hover:bg-background transition-all text-muted-foreground"
            title="Đường phân cách"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* Links & Media Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => {
              setLinkUrl(editor.getAttributes("link").href || "");
              setShowLinkDialog(true);
            }}
            className={`p-2 rounded-lg hover:bg-background transition-all ${editor.isActive("link") ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            title="Chèn liên kết"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEmbedUrl("");
              setShowEmbedDialog(true);
            }}
            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all"
            title="Nhúng nội dung (YouTube, SoundCloud...)"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all disabled:opacity-50"
            title="Tải ảnh lên"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-0.5" />

        {/* Actions Group */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-all"
            title="Xóa định dạng"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg hover:bg-background transition-all disabled:opacity-20 text-muted-foreground"
            title="Hoàn tác"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg hover:bg-background transition-all disabled:opacity-20 text-muted-foreground"
            title="Làm lại"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </div>
      )}

      {/* Editor Surface */}
      <div className="relative min-h-[800px]">
        {editor && (
          <>
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor }) => editor.isActive('zenImage')}
              className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => editor.chain().focus().updateAttributes('zenImage', { align: 'left', layout: 'block' }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('zenImage', { align: 'left' }) ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
                title="Căn trái"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().updateAttributes('zenImage', { align: 'center', layout: 'block' }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('zenImage', { align: 'center' }) ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
                title="Căn giữa"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().updateAttributes('zenImage', { align: 'right', layout: 'block' }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('zenImage', { align: 'right' }) ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
                title="Căn phải"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => editor.chain().focus().updateAttributes('zenImage', { layout: 'float-left' }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('zenImage', { layout: 'float-left' }) ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
                title="Bao quanh bên trái"
              >
                <IndentDecrease className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().updateAttributes('zenImage', { layout: 'float-right' }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('zenImage', { layout: 'float-right' }) ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
                title="Bao quanh bên phải"
              >
                <IndentIncrease className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                <input
                  type="text"
                  className="w-10 bg-transparent text-[11px] text-white outline-none text-center font-medium"
                  value={editor.getAttributes('zenImage').width?.toString().replace('%', '').replace('px', '') || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || !isNaN(Number(val))) {
                      const currentUnit = editor.getAttributes('zenImage').width?.toString().includes('px') ? 'px' : '%';
                      editor.commands.updateAttributes('zenImage', { width: val ? `${val}${currentUnit}` : '100%' });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      editor.commands.focus();
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const currentWidth = editor.getAttributes('zenImage').width?.toString() || '100%';
                    const isPx = currentWidth.includes('px');
                    const value = parseFloat(currentWidth);

                    // Lấy kích thước thực tế của ảnh để chuyển đổi
                    const node = document.querySelector('.image-resizer-container.is-selected');
                    if (!node) return;

                    if (isPx) {
                      // Chuyển px -> %
                      const parentWidth = node.parentElement?.getBoundingClientRect().width || 800;
                      const percent = ((value / parentWidth) * 100).toFixed(0);
                      editor.commands.updateAttributes('zenImage', { width: `${percent}%` });
                    } else {
                      // Chuyển % -> px
                      const px = node.getBoundingClientRect().width.toFixed(0);
                      editor.commands.updateAttributes('zenImage', { width: `${px}px` });
                    }
                  }}
                  className="text-[9px] text-primary font-bold hover:bg-white/10 px-1 rounded transition-colors"
                  title="Đổi đơn vị (px/%)"
                >
                  {editor.getAttributes('zenImage').width?.toString().includes('px') ? 'px' : '%'}
                </button>
              </div>
            </BubbleMenu>

            <BubbleMenu
              shouldShow={({ editor }) => !editor.isActive('image') && (editor.isActive('bold') || editor.isActive('italic') || editor.isActive('blockquote'))}
              className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive("blockquote") ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </BubbleMenu>

            {/* Formatting Bubble Menu */}
            {editor && (
              <BubbleMenu
                editor={editor}
                options={{
                  placement: 'top'
                }}
                shouldShow={({ editor, from, to }) => {
                  // Only show if it's a TEXT selection and NOT an empty selection
                  const isTextSelection = editor.state.selection instanceof TextSelection;
                  const isNodeSelection = editor.state.selection instanceof NodeSelection;
                  
                  return isTextSelection && 
                         from !== to && 
                         !editor.isActive('annotation') && 
                         !isNodeSelection;
                }}
              >
                <FormattingBubbleMenu editor={editor} />
              </BubbleMenu>
            )}
          </>
        )}
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .image-resizer-container {
          position: relative;
          display: block;
          margin: 1.5rem auto;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .image-resizer-container.is-selected {
          border-color: #8b5cf6;
          border-radius: 0.5rem;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .resizer-handle {
          position: absolute;
          right: -5px;
          bottom: -5px;
          width: 12px;
          height: 12px;
          background: #8b5cf6;
          border: 2px solid white;
          border-radius: 50%;
          cursor: nwse-resize;
          display: none;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .image-resizer-container.is-selected .resizer-handle,
        .image-resizer-container.is-resizing .resizer-handle {
          display: block;
          transform: scale(1.2);
          background: #8b5cf6;
        }

        .image-resizer-container.is-resizing {
          border-color: #8b5cf6;
          cursor: nwse-resize !important;
        }

        /* Layout Options */
        .image-resizer-container.float-left {
          float: left;
          margin-right: 2rem;
          margin-left: 0;
        }

        .image-resizer-container.float-right {
          float: right;
          margin-left: 2rem;
          margin-right: 0;
        }

        .image-resizer-container.block {
          float: none;
          clear: both;
        }

        .align-left { margin-left: 0; margin-right: auto; }
        .align-center { margin-left: auto; margin-right: auto; }
        .align-right { margin-left: auto; margin-right: 0; }

        .ProseMirror {
          padding-bottom: 20rem;
        }

        .spoiler-editor {
          background-color: rgba(139, 92, 246, 0.1);
          border-bottom: 2px dashed rgba(139, 92, 246, 0.5);
          color: inherit;
          border-radius: 2px;
        }
        .annotation-text {
        border-bottom: 2px dotted #8b5cf6;
        background-color: rgba(139, 92, 246, 0.05);
        cursor: help;
      }
      `}</style>
      <PromptDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        title="Chèn liên kết"
        description="Nhập địa chỉ URL bạn muốn liên kết đến văn bản đã chọn."
        placeholder="https://..."
        defaultValue={linkUrl}
        onConfirm={handleSetLink}
        label="Đường dẫn URL"
      />
      <PromptDialog
        open={showEmbedDialog}
        onOpenChange={setShowEmbedDialog}
        title="Nhúng nội dung"
        description="Dán mã nhúng Iframe hoặc đường dẫn YouTube, SoundCloud, Spotify vào đây."
        placeholder="https://..."
        defaultValue={embedUrl}
        onConfirm={handleSetEmbed}
        label="Mã nhúng / URL"
      />
    </div>
  );
}
