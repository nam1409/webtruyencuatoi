import { Node, Mark, mergeAttributes, Extension, RawCommands } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleSpoiler: () => ReturnType;
    setAnnotation: (note: string) => ReturnType;
    toggleAnnotation: () => ReturnType;
    unsetAnnotation: () => ReturnType;
    updateAnnotation: (note: string) => ReturnType;
    setFontSize: (fontSize: string) => ReturnType;
    unsetFontSize: () => ReturnType;
    setImage: (options: { src: string; alt?: string; width?: string; align?: string; layout?: string }) => ReturnType;
    setEmbed: (options: { src: string; width?: string; height?: number; align?: string }) => ReturnType;
    setAnimation: (animation: string) => ReturnType;
    unsetAnimation: () => ReturnType;
  }
}

export const Spoiler = Mark.create({
  name: 'spoiler',
  addAttributes() { return {} },
  parseHTML() { return [{ tag: 'span[data-type="spoiler"]' }, { tag: 'spoiler' }] },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'spoiler', class: 'spoiler-text' }), 0] },
  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }: any) => {
        return commands.toggleMark('spoiler')
      },
    } as any
  },
});

export const Annotation = Mark.create({
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
      setAnnotation: (note: string) => ({ commands }: any) => commands.setMark('annotation', { note }),
      toggleAnnotation: () => ({ commands }: any) => commands.toggleMark('annotation'),
      unsetAnnotation: () => ({ commands }: any) => commands.unsetMark('annotation'),
      updateAnnotation: (note: string) => ({ commands }: any) => commands.updateAttributes('annotation', { note }),
    } as any
  }
});

export const FontSize = Extension.create({
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
      setFontSize: (fontSize: any) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    } as any
  },
});

export const ZenImage = Node.create({
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
      setImage: (options: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    } as any
  },
});

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
      setEmbed: (options: { src: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    } as any
  },
});

export const BlockAnimation = Extension.create({
  name: 'blockAnimation',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'zenImage', 'bulletList', 'orderedList', 'listItem'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          animation: {
            default: null,
            parseHTML: element => element.getAttribute('data-animation'),
            renderHTML: attributes => {
              if (!attributes.animation) {
                return {}
              }
              return {
                'data-animation': attributes.animation,
                class: `animate-block-${attributes.animation}`,
              }
            },
          },
          animationDuration: {
            default: 'normal',
            parseHTML: element => element.getAttribute('data-animation-duration'),
            renderHTML: attributes => {
              if (!attributes.animationDuration || attributes.animationDuration === 'normal') {
                return {}
              }
              return {
                'data-animation-duration': attributes.animationDuration,
                style: `--animation-duration: ${attributes.animationDuration === 'slow' ? '1s' : '0.4s'}`,
              }
            },
          },
          animationDelay: {
            default: 0,
            parseHTML: element => element.getAttribute('data-animation-delay'),
            renderHTML: attributes => {
              if (!attributes.animationDelay) {
                return {}
              }
              return {
                'data-animation-delay': attributes.animationDelay,
                style: `--animation-delay: ${attributes.animationDelay}ms`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setAnimation: (animation: any) => ({ chain }: any) => {
        return chain()
          .updateAttributes('paragraph', { animation })
          .updateAttributes('heading', { animation })
          .updateAttributes('blockquote', { animation })
          .updateAttributes('zenImage', { animation })
          .updateAttributes('bulletList', { animation })
          .updateAttributes('orderedList', { animation })
          .updateAttributes('listItem', { animation })
          .run()
      },
      unsetAnimation: () => ({ chain }: any) => {
        return chain()
          .updateAttributes('paragraph', { animation: null })
          .updateAttributes('heading', { animation: null })
          .updateAttributes('blockquote', { animation: null })
          .updateAttributes('zenImage', { animation: null })
          .updateAttributes('bulletList', { animation: null })
          .updateAttributes('orderedList', { animation: null })
          .updateAttributes('listItem', { animation: null })
          .run()
      },
    } as any
  },
});

export const ParagraphId = Extension.create({
  name: 'paragraphId',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'zenImage', 'zenEmbed'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          'paragraph-id': {
            default: null,
            parseHTML: element => element.getAttribute('paragraph-id') || element.getAttribute('data-paragraph-id'),
            renderHTML: attributes => {
              if (!attributes['paragraph-id']) {
                return {}
              }
              return {
                'paragraph-id': attributes['paragraph-id'],
                'data-paragraph-id': attributes['paragraph-id'],
              }
            },
          },
        },
      },
    ]
  },
});
