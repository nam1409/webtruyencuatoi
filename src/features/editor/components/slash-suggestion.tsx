import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { 
  Type, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, Image as ImageIcon, 
  Square, CheckSquare, Minus, EyeOff, Info
} from 'lucide-react';
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
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
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
    <div className="bg-background border border-border shadow-2xl rounded-2xl overflow-hidden min-w-[200px] p-1 animate-in fade-in zoom-in-95 duration-100">
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all ${
              index === selectedIndex ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === selectedIndex ? "bg-white/20" : "bg-muted"}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">{item.title}</p>
              <p className={`text-[10px] ${index === selectedIndex ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{item.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-3 text-xs text-muted-foreground italic">Không tìm thấy lệnh...</div>
      )}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
