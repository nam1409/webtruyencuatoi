import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import { NodeId } from "@/features/editor/components/NodeId";

export function renderTiptapContent(json: any) {
  if (!json) return "";
  
  // Custom renderer to add IDs to paragraphs for in-line comments
  const html = generateHTML(json, [
    StarterKit.configure({
        heading: {
            levels: [2, 3],
        }
    }),
    Image.configure({
        HTMLAttributes: {
            class: "rounded-2xl border border-border/50 shadow-lg my-8 max-w-full h-auto mx-auto",
        },
    }),
    Mention.configure({
      HTMLAttributes: {
        class: "character-mention text-primary font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all",
      },
    }),
    NodeId,
  ]);

  return html;
}
