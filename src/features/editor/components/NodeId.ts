import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeId: {
      applyIds: () => ReturnType,
    }
  }
}

export const NodeId = Extension.create({
  name: 'nodeId',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'zenImage', 'bulletList', 'orderedList', 'taskList', 'listItem', 'taskItem'],
      attributeName: 'paragraph-id',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          [this.options.attributeName]: {
            default: null,
            keepOnSplit: false,
            parseHTML: element => element.getAttribute(`data-${this.options.attributeName}`) || element.getAttribute('id'),
            renderHTML: attributes => {
              if (!attributes[this.options.attributeName]) {
                return {}
              }
              return {
                [`data-${this.options.attributeName}`]: attributes[this.options.attributeName],
              }
            },
          },
        },
      },
    ]
  },

  addStorage() {
    return {
      generateId: () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      },
    }
  },

  onCreate() {
    this.editor.commands.applyIds();
  },

  onUpdate() {
    this.editor.commands.applyIds();
  },

  onSelectionUpdate() {
    this.editor.commands.applyIds();
  },

  addCommands() {
    return {
      applyIds: () => ({ tr, state, dispatch }: any) => {
        const { doc } = state;
        const { types, attributeName } = this.options;
        let modified = false;

        doc.descendants((node: any, pos: any) => {
          if (types.includes(node.type.name) && !node.attrs[attributeName]) {
            tr.setNodeMarkup(pos, node.type, {
              ...node.attrs,
              [attributeName]: this.storage.generateId(),
            });
            modified = true;
          }
          return true;
        });

        if (modified && dispatch) {
          tr.setMeta('addToHistory', false);
          dispatch(tr);
        }
        return modified;
      }
    }
  },

  addProseMirrorPlugins() {
    const { types, attributeName } = this.options;
    const storage = this.storage;

    return [
      new Plugin({
        key: new PluginKey('nodeId'),
        appendTransaction: (transactions, oldState, newState) => {
          if (newState.doc === oldState.doc) return;

          const tr = newState.tr;
          let modified = false;
          
          // Map to track who "owns" an ID in this document
          // ID -> { pos, hasContent }
          const idOwners = new Map<string, { pos: number, hasContent: boolean }>();

          newState.doc.descendants((node, pos) => {
            if (types.includes(node.type.name)) {
              const id = node.attrs[attributeName];
              const hasContent = node.textContent.trim().length > 0 || node.childCount > 0;

              if (!id) {
                // Case 1: No ID at all
                tr.setNodeMarkup(pos, node.type, {
                  ...node.attrs,
                  [attributeName]: storage.generateId(),
                });
                modified = true;
              } else if (idOwners.has(id)) {
                // Case 2: Duplicate ID found!
                const owner = idOwners.get(id)!;

                if (!owner.hasContent && hasContent) {
                  // The new node has content but the previous "owner" didn't.
                  // Swap! Give the previous owner a new ID and let this one keep it.
                  tr.setNodeMarkup(owner.pos, newState.doc.nodeAt(owner.pos)!.type, {
                    ...newState.doc.nodeAt(owner.pos)!.attrs,
                    [attributeName]: storage.generateId(),
                  });
                  
                  // This node keeps the ID, update owner info for potential future duplicates
                  idOwners.set(id, { pos, hasContent });
                  modified = true;
                } else {
                  // This node is either empty or the previous owner already had content.
                  // This one gets a new ID.
                  tr.setNodeMarkup(pos, node.type, {
                    ...node.attrs,
                    [attributeName]: storage.generateId(),
                  });
                  modified = true;
                }
              } else {
                // Case 3: First time seeing this ID
                idOwners.set(id, { pos, hasContent });
              }
            }
            return true;
          });

          return modified ? tr : null;
        }
      })
    ]
  },
});
