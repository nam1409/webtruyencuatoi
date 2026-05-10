"use server";

import { createClient } from "@/lib/supabase/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import epub from "epub-gen-memory";

// Simple Tiptap JSON to HTML/Plain Text converter
function tiptapToHtml(json: any): string {
  if (!json || !json.content) return "";
  
  return json.content.map((node: any) => {
    if (node.type === 'paragraph') {
      const text = node.content?.map((t: any) => t.text).join("") || "";
      return `<p>${text}</p>`;
    }
    if (node.type === 'heading') {
      const text = node.content?.map((t: any) => t.text).join("") || "";
      return `<h${node.attrs.level}>${text}</h${node.attrs.level}>`;
    }
    return "";
  }).join("");
}

function tiptapToDocxNodes(json: any): any[] {
  if (!json || !json.content) return [];
  
  const nodes: any[] = [];
  
  json.content.forEach((node: any) => {
    if (node.type === 'paragraph') {
      const text = node.content?.map((t: any) => t.text).join("") || "";
      nodes.push(new Paragraph({
        children: [new TextRun(text)],
      }));
    }
    if (node.type === 'heading') {
      const text = node.content?.map((t: any) => t.text).join("") || "";
      nodes.push(new Paragraph({
        text: text,
        heading: node.attrs.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      }));
    }
  });
  
  return nodes;
}

export async function exportStoryToEPUB(storyId: string) {
  const supabase = await createClient();
  
  const { data: story } = await supabase
    .from("stories")
    .select("*, chapters(*, chapter_versions(content_json, is_primary))")
    .eq("id", storyId)
    .single();

  if (!story) throw new Error("Story not found");

  const sortedChapters = (story.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index);

  const option = {
    title: story.title,
    author: story.author_name || "ZenStory Author",
    cover: story.cover_url || undefined,
    content: sortedChapters.map((chap: any) => {
      // Tìm phiên bản primary trong mảng chapter_versions (kết quả của join)
      const primaryVersion = chap.chapter_versions?.find((v: any) => v.is_primary);
      const content = primaryVersion?.content_json || chap.content_json;
      
      return {
        title: chap.title,
        content: tiptapToHtml(content)
      };
    })
  };

  const buffer = await epub(option, option.content);
  return buffer.toString("base64");
}

export async function exportStoryToDOCX(storyId: string) {
  const supabase = await createClient();
  
  const { data: story } = await supabase
    .from("stories")
    .select("*, chapters(*, chapter_versions(content_json, is_primary))")
    .eq("id", storyId)
    .single();

  if (!story) throw new Error("Story not found");

  const sortedChapters = (story.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index);

  const sections: any[] = [];
  
  // Title Page
  sections.push({
    children: [
      new Paragraph({
        text: story.title,
        heading: HeadingLevel.TITLE,
        alignment: "center",
      }),
      new Paragraph({
        text: `Tác giả: ${story.author_name || "ZenStory Author"}`,
        alignment: "center",
      }),
    ],
  });

  // Chapters
  sortedChapters.forEach((chap: any) => {
    // Tìm phiên bản primary
    const primaryVersion = chap.chapter_versions?.find((v: any) => v.is_primary);
    const content = primaryVersion?.content_json || chap.content_json;

    sections.push({
      children: [
        new Paragraph({
          text: chap.title,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true, // Page break before chapter
        }),
        ...tiptapToDocxNodes(content)
      ],
    });
  });

  const doc = new Document({
    sections: sections
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString("base64");
}
