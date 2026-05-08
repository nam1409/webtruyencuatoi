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
import { PromptDialog } from "@/components/ui/prompt-dialog";
import {
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo,
  Image as ImageIcon, Type, Loader2, Sparkles, Plus,
  Heading2, Heading3, Link as LinkIcon, Underline as UnderlineIcon,
  Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Eraser, Baseline, Highlighter, CheckSquare,
  IndentIncrease, IndentDecrease, Type as FontSizeIcon, Maximize, Minimize,
  EyeOff, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import { Node, Extension, Mark, mergeAttributes } from "@tiptap/core";
import { NodeId } from "./NodeId";

// Rebuild Image Node as zenImage to avoid any Tiptap internal conflicts
const ZenImageExtension = Node.create({
  name: 'zenImage',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      width: {
        default: '100%',
      },
      align: {
        default: 'center',
      },
      layout: {
        default: 'block',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.image-resizer-container',
        getAttrs: element => ({
          src: (element as HTMLElement).querySelector('img')?.getAttribute('src'),
          width: (element as HTMLElement).style.width || (element as HTMLElement).getAttribute('data-width') || '100%',
          align: (element as HTMLElement).getAttribute('data-align') || 'center',
          layout: (element as HTMLElement).getAttribute('data-layout') || 'block',
        })
      },
      { tag: 'img[src]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      class: `image-resizer-container ${HTMLAttributes.layout} align-${HTMLAttributes.align}`,
      style: `width: ${HTMLAttributes.width}`,
      'data-align': HTMLAttributes.align,
      'data-layout': HTMLAttributes.layout,
      'data-width': HTMLAttributes.width,
    }, ['img', mergeAttributes(HTMLAttributes, { style: 'width: 100%; display: block;' })]]
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.className = `image-resizer-container ${node.attrs.layout} align-${node.attrs.align}`;
      container.style.width = node.attrs.width;

      const img = document.createElement('img');
      img.src = node.attrs.src || '';
      img.alt = node.attrs.alt || '';
      img.style.width = '100%';
      img.style.display = 'block';

      const resizer = document.createElement('div');
      resizer.className = 'resizer-handle';

      let startX: number, startWidth: number;

      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.pageX;
        startWidth = container.getBoundingClientRect().width;
        let finalWidthPercent = node.attrs.width;
        container.classList.add('is-resizing');

        const onMouseMove = (moveEvent: MouseEvent) => {
          const dx = moveEvent.pageX - startX;
          const currentWidth = startWidth + dx;
          const parentWidth = container.parentElement?.getBoundingClientRect().width || 800;
          const currentUnit = node.attrs.width?.includes('px') ? 'px' : '%';

          if (currentUnit === '%') {
            const widthPercent = Math.min(100, Math.max(5, (currentWidth / parentWidth) * 100));
            finalWidthPercent = `${widthPercent.toFixed(2)}%`;
          } else {
            const widthPx = Math.max(20, currentWidth);
            finalWidthPercent = `${widthPx.toFixed(0)}px`;
          }
          container.style.width = finalWidthPercent;
        };

        const onMouseUp = () => {
          container.classList.remove('is-resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
              editor.view.dispatch(
                editor.view.state.tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  width: finalWidthPercent,
                })
              );
            }
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      container.appendChild(img);
      container.appendChild(resizer);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'zenImage') return false;
          container.style.width = updatedNode.attrs.width;
          container.className = `image-resizer-container ${updatedNode.attrs.layout} align-${updatedNode.attrs.align} ${container.classList.contains('is-selected') ? 'is-selected' : ''}`;
          img.src = updatedNode.attrs.src || '';
          img.alt = updatedNode.attrs.alt || '';
          return true;
        },
        selectNode: () => container.classList.add('is-selected'),
        deselectNode: () => container.classList.remove('is-selected'),
      };
    };
  },
});

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

const Spoiler = Mark.create({
  name: 'spoiler',
  addAttributes() { return {} },
  parseHTML() { return [{ tag: 'span[data-type="spoiler"]' }, { tag: 'spoiler' }] },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'spoiler', class: 'spoiler-text' }), 0] },
  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark('spoiler')
      },
    }
  },
});

const Annotation = Mark.create({
  name: 'annotation',
  addAttributes() {
    return {
      note: {
        default: null,
        parseHTML: element => element.getAttribute('data-note'),
        renderHTML: attributes => ({ 'data-note': attributes.note }),
      }
    };
  },
  parseHTML() { return [{ tag: 'span[data-type="annotation"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'annotation',
      class: 'annotation-text',
      title: HTMLAttributes['data-note']
    }), 0]
  },
  addCommands() {
    return {
      setAnnotation: (note: string) => ({ commands }) => commands.setMark('annotation', { note }),
      toggleAnnotation: () => ({ commands }) => commands.toggleMark('annotation'),
      unsetAnnotation: () => ({ commands }) => commands.unsetMark('annotation'),
      updateAnnotation: (note: string) => ({ commands }) => commands.updateAttributes('annotation', { note }),
    }
  }
});

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

interface TiptapEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  isSaving?: boolean;
  storyId: string;
  isReadOnly?: boolean;
}

export function TiptapEditor({ initialContent, onChange, isSaving, storyId, isReadOnly = false }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    getCharactersByStory(storyId).then(setCharacters);
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
      Mention.configure({
        HTMLAttributes: {
          class: "character-mention text-primary font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all",
        },
        suggestion: suggestion(() => charactersRef.current),
      }),
      Mention.extend({
        name: "slashCommand",
      }).configure({
        HTMLAttributes: {
          class: "hidden",
        },
        suggestion: slashSuggestion,
        renderText: () => "",
      }),
      NodeId,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      // console.log('Tiptap JSON Update:', json); // Dòng này giúp bạn soi dữ liệu ở Console
      onChange(json);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[600px] font-serif leading-relaxed selection:bg-primary/20 transition-all duration-500",
          isReadOnly ? "p-4 sm:p-10 opacity-70 cursor-default" : "p-4 sm:p-24"
        ),
      },
    },
    editable: !isReadOnly,
    immediatelyRender: false,
  }, []); // Only init once!

  const handleSetLink = (url: string) => {
    if (!editor) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

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

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full transition-all duration-500">
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

      {/* Editor Toolbar */}
      {!isReadOnly && (
        <div className="sticky top-0 flex flex-wrap items-center gap-2 p-2 bg-background border-b border-border/50 shadow-sm">
        {/* Style Dropdown */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === "p") editor.chain().focus().setParagraph().run();
              else if (val.startsWith("h")) {
                const level = parseInt(val[1]) as 1 | 2 | 3 | 4;
                editor.chain().focus().setHeading({ level }).run();
              }
            }}
            value={
              editor.isActive("heading", { level: 1 }) ? "h1" :
                editor.isActive("heading", { level: 2 }) ? "h2" :
                  editor.isActive("heading", { level: 3 }) ? "h3" :
                    editor.isActive("heading", { level: 4 }) ? "h4" : "p"
            }
            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-2 py-1 focus:outline-none cursor-pointer hover:bg-background rounded-lg transition-all"
          >
            <option value="p">Văn bản thường</option>
            <option value="h1">Tiêu đề chính</option>
            <option value="h2">Tiêu đề chương</option>
            <option value="h3">Phân đoạn 1</option>
            <option value="h4">Phân đoạn 2</option>
          </select>
        </div>

        {/* Font Size Dropdown */}
        <div className="flex items-center gap-0.5 bg-muted/30 p-1 rounded-xl">
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === "default") (editor.commands as any).unsetFontSize();
              else (editor.commands as any).setFontSize(val);
            }}
            className="bg-transparent text-[10px] font-black px-2 py-1 focus:outline-none cursor-pointer hover:bg-background rounded-lg transition-all"
          >
            <option value="default">Size</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="32px">32</option>
          </select>
        </div>

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
    </div>
  );
}
