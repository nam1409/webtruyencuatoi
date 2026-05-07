"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User } from 'lucide-react';

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-background border border-border shadow-2xl rounded-2xl overflow-hidden min-w-[200px] p-2 animate-in fade-in zoom-in-95 duration-200">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-xl transition-all ${
              index === selectedIndex ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 ${index === selectedIndex ? 'bg-white/20' : 'bg-muted'}`}>
              {item.avatar_url ? (
                <img src={item.avatar_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className={`w-4 h-4 ${index === selectedIndex ? 'text-white' : 'text-muted-foreground/40'}`} />
                </div>
              )}
            </div>
            <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
          Không tìm thấy nhân vật
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
