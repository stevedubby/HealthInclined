import { isTiptapJsonContent } from "@/lib/tiptap-article";

/** First image `src` from TipTap JSON body, if any. */
export function extractFirstImageSrcFromContent(content: string): string | null {
  if (!isTiptapJsonContent(content)) return null;
  try {
    const doc = JSON.parse(content) as { content?: unknown[] };
    return walkForImage(doc.content);
  } catch {
    return null;
  }
}

function walkForImage(nodes: unknown[] | undefined): string | null {
  if (!nodes) return null;
  for (const n of nodes) {
    const node = n as { type?: string; attrs?: { src?: string }; content?: unknown[] };
    if (node.type === "image" && typeof node.attrs?.src === "string" && node.attrs.src.trim()) {
      return node.attrs.src.trim();
    }
    const inner = walkForImage(node.content);
    if (inner) return inner;
  }
  return null;
}

/** Prefer explicit thumbnail URL, else first inline image in article body. */
export function resolvePostThumbnailUrl(
  thumbnailUrl: string | undefined,
  content: string,
): string | null {
  const t = thumbnailUrl?.trim();
  if (t) return t;
  return extractFirstImageSrcFromContent(content);
}
