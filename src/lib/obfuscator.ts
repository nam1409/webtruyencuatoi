/**
 * ZenStory Elite - Advanced Glyph Mapping Engine
 * This engine replaces raw text with numerical glyph indices.
 * Even if the code is open source, the character mapping is randomized per-request.
 */

const ALPHABET = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ";

/**
 * Generates a randomized character map (Alphabet Shuffle)
 */
export function generateDynamicMap(): string {
  const chars = ALPHABET.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Encodes plain text into an array of glyph indices
 */
export function encodeToGlyphs(text: string, map: string): number[] {
  if (!text) return [];
  return text.split('').map(char => {
    const index = map.indexOf(char);
    return index !== -1 ? index : -1;
  });
}

/**
 * Obfuscates a full Tiptap JSON structure into Glyph format
 */
export function obfuscateToGlyphs(json: any) {
  const map = generateDynamicMap();
  
  const processNode = (node: any): any => {
    if (!node) return node;
    
    if (node.type === 'text' && typeof node.text === 'string') {
      return {
        ...node,
        glyphs: encodeToGlyphs(node.text, map),
        text: undefined
      };
    }
    
    if (node.content && Array.isArray(node.content)) {
      return {
        ...node,
        content: node.content.map(processNode)
      };
    }
    
    return node;
  };

  return {
    data: processNode(json),
    key: obfuscateKey(map)
  };
}

/**
 * Obfuscates the mapping key to deter simple inspection
 * Handles Unicode characters safely for btoa/atob
 */
export function obfuscateKey(key: string): string {
  try {
    // Chuyển Unicode sang chuỗi an toàn cho btoa
    const utf8Safe = encodeURIComponent(key).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Safe.split('').reverse().join(''));
  } catch (e) {
    return "";
  }
}

export function deobfuscateKey(obfuscatedKey: string): string {
  try {
    const utf8Safe = atob(obfuscatedKey).split('').reverse().join('');
    // Chuyển ngược lại sang Unicode
    return decodeURIComponent(utf8Safe.split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) {
    return ALPHABET;
  }
}
