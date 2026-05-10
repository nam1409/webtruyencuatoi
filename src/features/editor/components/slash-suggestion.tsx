import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { 
  Type, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, Image as ImageIcon, 
  Square, CheckSquare, Minus, EyeOff, Info, ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import React, { forwardRef, useImperativeHandle, useState } from "react";

export const slashSuggestion = {
  items: ({ query }: { query: string }) => {
    return [
      {
        title: "Tiêu đề lớn",
        description: "Heading 2",
        icon: Heading2,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
      },
      {
        title: "Tiêu đề vừa",
        description: "Heading 3",
        icon: Heading3,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
        },
      },
      {
        title: "Danh sách",
        description: "Bullet list",
        icon: List,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Trích dẫn",
        description: "Blockquote",
        icon: Quote,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: 'Spoiler',
        description: 'Ẩn nội dung nhạy cảm.',
        icon: EyeOff,
        command: ({ editor, range }: any) => {
          (editor.chain() as any).focus().deleteRange(range).toggleSpoiler().run();
        },
      },
      {
        title: 'Ghi chú',
        description: 'Thêm giải thích cho cụm từ.',
        icon: Info,
        command: ({ editor, range }: any) => {
          (editor.chain() as any).focus().deleteRange(range).setAnnotation("").run();
        },
      },
      {
        title: 'Nhúng nội dung',
        description: 'YouTube, SoundCloud, Spotify...',
        icon: ChevronRight,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).run();
          if ((editor as any).openEmbedDialog) {
            (editor as any).openEmbedDialog();
          }
        },
      },
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
  },

  command: (props: any) => {
    if (!props) return;
    const { editor, range, item } = props;
    if (item && typeof item.command === 'function') {
      item.command({ editor, range });
    }
  },

  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandList, {
          props,
          editor: props.editor,
        });

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

const SlashCommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change to prevent out of bounds errors
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.7)] rounded-[2rem] overflow-hidden min-w-[280px] p-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
      <div className="px-3 py-2 mb-1">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Lệnh biên tập</span>
      </div>
      <div className="space-y-1">
        {props.items.length > 0 ? (
          props.items.map((item: any, index: number) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={cn(
                "w-full flex items-center gap-4 px-3 py-2.5 text-left rounded-2xl transition-all duration-300 group",
                index === selectedIndex 
                  ? "bg-primary text-white shadow-xl shadow-primary/20 translate-x-1" 
                  : "hover:bg-white/5 text-zinc-400"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                index === selectedIndex ? "bg-white/20 rotate-6" : "bg-zinc-800 group-hover:bg-zinc-700"
              )}>
                <item.icon className={cn("w-5 h-5", index === selectedIndex ? "text-white" : "text-zinc-500")} />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-black tracking-tight">{item.title}</p>
                <p className={cn(
                  "text-[10px] font-medium leading-none mt-1",
                  index === selectedIndex ? "text-white/60" : "text-zinc-600"
                )}>
                  {item.description}
                </p>
              </div>
              {index === selectedIndex && (
                <div className="ml-auto opacity-40">
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Không tìm thấy lệnh...</p>
          </div>
        )}
      </div>
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
