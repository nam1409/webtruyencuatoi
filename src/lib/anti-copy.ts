
import katex from 'katex';

export function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

/**
 * Render các định dạng (Marks) sang HTML
 */
function renderMarksToHtml(text: string, marks: any[] = []): string {
  if (!marks || marks.length === 0) return text;

  let result = text;

  const sortedMarks = [...marks].sort((a, b) => {
    const order = ['link', 'bold', 'italic', 'underline', 'strike', 'textStyle', 'highlight', 'spoiler', 'annotation', 'characterMention', 'math'];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  sortedMarks.forEach(mark => {
    switch (mark.type) {
      case 'bold':
        result = `<strong style="font-weight: 700; color: inherit;">${result}</strong>`;
        break;
      case 'italic':
        result = `<em style="font-style: italic; color: inherit;">${result}</em>`;
        break;
      case 'underline':
        result = `<u style="text-decoration: underline; text-underline-offset: 4px; color: inherit;">${result}</u>`;
        break;
      case 'strike':
        result = `<s style="text-decoration: line-through; opacity: 0.6; color: inherit;">${result}</s>`;
        break;
      case 'link':
        result = `<a href="${mark.attrs?.href || '#'}" target="${mark.attrs?.target || '_blank'}" class="text-primary hover:underline underline-offset-4 transition-all" style="color: var(--primary); text-decoration: underline; text-underline-offset: 4px;">${result}</a>`;
        break;
      case 'textStyle':
        if (mark.attrs?.color || mark.attrs?.fontSize) {
          const styles = [];
          if (mark.attrs?.color) styles.push(`color: ${mark.attrs.color}`);
          if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
          result = `<span style="${styles.join('; ')}">${result}</span>`;
        }
        break;
      case 'highlight':
        if (mark.attrs?.color) {
          result = `<span style="background-color: ${mark.attrs.color}; padding: 0.1em 0.3em; border-radius: 0.3em; color: inherit; box-decoration-break: clone; -webkit-box-decoration-break: clone;">${result}</span>`;
        }
        break;
      case 'spoiler':
        result = `<span class="spoiler-text">${result}</span>`;
        break;
      case 'annotation':
        result = `<span class="annotation-span" data-note="${mark.attrs?.note || ''}">${result}</span>`;
        break;
      case 'characterMention':
        result = `<span class="character-mention" data-char-id="${mark.attrs?.id}">${result}</span>`;
        break;
      case 'math':
        try {
          const formula = mark.attrs?.formula || '';
          const html = katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false
          });
          result = html;
        } catch (e) {
          result = `<code class="math-fallback">${mark.attrs?.formula || ''}</code>`;
        }
        break;
    }
  });

  return result;
}

function renderContentToHtml(content: any[] = []): string {
  if (!content) return '';
  return content.map(node => {
    if (node.type === 'text') {
      return renderMarksToHtml(node.text, node.marks);
    }
    if (node.type === 'hardBreak') {
      return '<br />';
    }
    return '';
  }).join('');
}

function renderNodeToHtml(node: any, index: number, chapterId: string, options: { isHardcore?: boolean } = {}): string {
  const nodeId = node.attrs?.['paragraph-id'] || `p-${index}`;
  const junkClassName = `v-${hash(chapterId + 'junk')}`;

  // Chỉ thêm Junk Node nếu ở chế độ Hardcore (Server Render)
  const junkNode = options.isHardcore && Math.random() > 0.8
    ? `<span class="${junkClassName}">${hash(Math.random().toString())}</span>`
    : '';

  const animation = node.attrs?.animation;
  const duration = node.attrs?.animationDuration;
  const delay = node.attrs?.animationDelay;
  const animationClass = animation ? `animate-block-${animation}` : '';
  const animationStyles = animation ? `opacity: 0; animation-fill-mode: forwards; animation-duration: ${duration === 'slow' ? '1s' : duration === 'fast' ? '0.3s' : '0.6s'}; animation-delay: ${delay || 0}ms;` : '';

  switch (node.type) {
    case 'paragraph':
      const pAlign = node.attrs?.textAlign || 'left';
      return `<p data-paragraph-id="${nodeId}" ${animation ? `data-animation="${animation}"` : ''} class="mb-4 transition-all duration-300 cursor-pointer hover:bg-primary/5 rounded-xl px-2 -mx-2 relative group ${animationClass}" style="font-size: var(--reader-font-size); line-height: var(--reader-line-height); margin-bottom: var(--reader-paragraph-spacing); color: inherit; font-family: inherit; text-align: ${pAlign}; ${animationStyles}">
                ${renderContentToHtml(node.content)}
                ${junkNode}
                <span data-comment-placeholder="${nodeId}"></span>
              </p>`;

    case 'heading':
      const level = node.attrs?.level || 2;
      const sizeClass = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : level === 3 ? "text-lg" : "text-base";
      const hClass = `font-bold ${sizeClass} my-4 relative group cursor-pointer hover:bg-primary/5 rounded-xl px-2 -mx-2 transition-all ${animationClass}`;
      const hAlign = node.attrs?.textAlign || 'left';
      return `<h${level} data-paragraph-id="${nodeId}" ${animation ? `data-animation="${animation}"` : ''} class="${hClass}" style="color: inherit; font-family: inherit; line-height: 1.2; text-align: ${hAlign}; ${animationStyles}">
                ${renderContentToHtml(node.content)}
                <span data-comment-placeholder="${nodeId}"></span>
              </h${level}>`;

    case 'zenEmbed':
      const embedAlign = node.attrs?.align || 'center';
      return `<div class="zen-embed-container my-8 flex" style="display: flex; justify-content: ${embedAlign === 'left' ? 'flex-start' : embedAlign === 'right' ? 'flex-end' : 'center'};">
                <iframe 
                  src="${node.attrs?.src}" 
                  width="${node.attrs?.width || '100%'}" 
                  height="${node.attrs?.height || '450'}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                  style="width: ${node.attrs?.width || '100%'}; max-width: 100%; height: ${node.attrs?.height || 450}px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1);"
                ></iframe>
              </div>`;

    case 'bulletList':
      return `<ul class="list-disc list-outside ml-6 mb-6 space-y-2" style="color: inherit; font-family: inherit;">
                ${(node.content || []).map((child: any, i: number) => renderNodeToHtml(child, i, chapterId, options)).join('')}
              </ul>`;

    case 'orderedList':
      return `<ol class="list-decimal list-outside ml-6 mb-6 space-y-2" style="color: inherit; font-family: inherit;">
                ${(node.content || []).map((child: any, i: number) => renderNodeToHtml(child, i, chapterId, options)).join('')}
              </ol>`;

    case 'listItem':
      return `<li class="pl-1" style="color: inherit; font-family: inherit;">
                ${(node.content || []).map((child: any, i: number) => {
        if (child.type === 'paragraph') {
          return `<span>${renderContentToHtml(child.content)}</span>`;
        }
        return renderNodeToHtml(child, i, chapterId, options);
      }).join('')}
              </li>`;

    case 'horizontalRule':
      return `<hr class="my-8 border-t border-border w-1/3 mx-auto" />`;

    case 'image':
    case 'zenImage':
      const src = node.attrs?.src;
      const imgWidth = node.attrs?.width || '100%';
      const align = node.attrs?.align || 'center';
      return `<div class="flex my-12 w-full" style="justify-content: ${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'}">
                <img src="${src}" style="width: ${imgWidth};" class="max-w-full h-auto rounded-2xl shadow-xl transition-transform hover:scale-[1.02]" />
              </div>`;

    default:
      return '';
  }
}

export function renderToHtml(json: any, chapterId: string, options: { isHardcore?: boolean } = {}): string {
  if (!json || !json.content) return '';

  const junkClassName = `v-${hash(chapterId + 'junk')}`;
  const containerClass = `v-${hash(chapterId + 'container')}`;

  const html = json.content.map((node: any, index: number) => {
    return renderNodeToHtml(node, index, chapterId, options);
  }).join('\n');

  return `<div class="${containerClass} reader-content">${html}</div>`;
}

export function getAntiCopyStyles(chapterId: string, junkClass: string, camoClass: string): string {
  return `
    .${junkClass} {
      display: inline !important;
      position: static !important;
      width: auto !important;
      height: auto !important;
      color: rgba(0,0,0,0.015) !important;
      opacity: 0.015 !important;
      user-select: text !important;
      pointer-events: none !important;
      font-size: 0.92em !important;
      line-height: inherit !important;
      letter-spacing: -0.15px !important;
      visibility: visible !important;
      transform: scale(0.98) !important;
    }
  `;
}
