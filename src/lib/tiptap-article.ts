import type { Extensions } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { marked } from "marked";

/** Empty TipTap document (one paragraph). */
export const EMPTY_TIPTAP_DOC_JSON = '{"type":"doc","content":[{"type":"paragraph"}]}';

export function isTiptapJsonContent(s: string): boolean {
  const t = s.trim();
  if (!t.startsWith("{")) return false;
  try {
    const j = JSON.parse(t) as { type?: string };
    return j.type === "doc";
  } catch {
    return false;
  }
}

function walkText(nodes: unknown[] | undefined): string {
  if (!nodes) return "";
  let out = "";
  for (const n of nodes) {
    const node = n as { type?: string; text?: string; content?: unknown[] };
    if (typeof node.text === "string") out += node.text;
    if (node.content) out += walkText(node.content);
  }
  return out;
}

export function extractPlainTextFromTiptapDocString(s: string): string {
  try {
    const doc = JSON.parse(s) as { type?: string; content?: unknown[] };
    if (doc.type !== "doc") return "";
    return walkText(doc.content);
  } catch {
    return "";
  }
}

export function isTiptapDocEmpty(s: string): boolean {
  return extractPlainTextFromTiptapDocString(s).trim().length === 0;
}

/**
 * Shared schema for editor, generateHTML, and generateJSON (no placeholder).
 */
export function getArticleExtensions(options?: { placeholder?: string }): Extensions {
  const core: Extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      code: false,
      codeBlock: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "font-medium text-emerald-700 underline underline-offset-4",
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg my-6",
      },
    }),
  ];

  if (options?.placeholder) {
    return [
      ...core,
      Placeholder.configure({
        placeholder: options.placeholder,
      }),
    ];
  }

  return core;
}

/** One-way migration: legacy Markdown → TipTap JSON (for admin load only). */
export function markdownToTiptapJson(md: string): string {
  const html = marked.parse(md.trim(), { async: false });
  const doc = generateJSON(html, getArticleExtensions());
  return JSON.stringify(doc);
}

export function isValidArticleBody(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  if (isTiptapJsonContent(body)) return !isTiptapDocEmpty(body);
  return false;
}

/** Minimum plain-text length in the article body before server draft autosave runs. */
export const AUTOSAVE_MIN_BODY_PLAIN_CHARS = 25;

export function draftPlainTextMeetsAutosaveThreshold(docJson: string): boolean {
  return (
    extractPlainTextFromTiptapDocString(docJson).trim().length >= AUTOSAVE_MIN_BODY_PLAIN_CHARS
  );
}
