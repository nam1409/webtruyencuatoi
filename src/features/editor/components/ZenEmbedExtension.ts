"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ZenEmbedView } from './ZenEmbedView';

export const ZenEmbed = Node.create({
  name: 'zenEmbed',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 450,
      },
      align: {
        default: 'center',
      },
      frameborder: {
        default: '0',
      },
      allow: {
        default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      },
      allowfullscreen: {
        default: 'true',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: element => ({
          src: (element as HTMLElement).getAttribute('src'),
          width: (element as HTMLElement).getAttribute('width') || '100%',
          height: (element as HTMLElement).getAttribute('height') || '450',
          align: (element as HTMLElement).getAttribute('data-align') || 'center',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || 'center';
    const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
    
    return ['div', { 
      class: 'zen-embed-container my-8 flex',
      style: `display: flex; justify-content: ${justifyContent};`
    }, ['iframe', mergeAttributes(HTMLAttributes, {
      style: `width: ${HTMLAttributes.width}; height: ${HTMLAttributes.height}px; border-radius: 12px;`,
      'data-align': align,
    })]]
  },

  addCommands() {
    return {
      setEmbed: (options: { src: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ZenEmbedView)
  },
});
