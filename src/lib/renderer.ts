import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import { NodeId } from "@/features/editor/components/NodeId";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Mathematics } from "@tiptap/extension-mathematics";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Spoiler, Annotation, FontSize, ZenImage, BlockAnimation, ZenEmbed } from "@/features/editor/components/extensions";
import { mergeAttributes } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Heading from "@tiptap/extension-heading";

export function renderTiptapContent(json: any) {
  if (!json) return "";
  
  // Custom renderer to add IDs to paragraphs for in-line comments
  const html = generateHTML(json, [
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
    ZenImage.configure({
        HTMLAttributes: {
            class: "rounded-2xl border border-border/50 shadow-lg my-8 max-w-full h-auto mx-auto",
        },
    }),
    Mention.configure({
      HTMLAttributes: {
        class: "character-mention text-primary font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all",
      },
    }),
    Underline,
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    Mathematics,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline decoration-2 underline-offset-4 font-bold",
      },
    }),
    Spoiler,
    Annotation,
    BlockAnimation,
    TaskList,
    TaskItem.configure({ nested: true }),
    ZenEmbed,
    NodeId,
  ]);

  return html;
}
