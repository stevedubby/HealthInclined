import { extractPlainTextFromTiptapDocString, isTiptapJsonContent } from "@/lib/tiptap-article";

const WORDS_PER_MINUTE = 200;

/** Estimated reading time in minutes (at least 1). */
export function estimateArticleReadMinutes(content: string): number {
  let text = "";
  if (isTiptapJsonContent(content)) {
    text = extractPlainTextFromTiptapDocString(content);
  } else {
    text = content.replace(/[#*_`[\]()]/g, " ");
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
