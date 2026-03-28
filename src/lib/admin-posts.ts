import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { PostFrontmatter, RelatedLink } from "@/lib/content/posts";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length > 0 && slug.length <= 120;
}

export function parseRelatedLines(text: string): RelatedLink[] {
  const out: RelatedLink[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const pipe = trimmed.indexOf("|");
    if (pipe === -1) continue;
    const slug = trimmed.slice(0, pipe).trim();
    const anchor = trimmed.slice(pipe + 1).trim();
    if (slug && anchor) out.push({ slug, anchor });
  }
  return out;
}

export function parseKeywords(text: string): string[] {
  return text
    .split(/[,|\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function writePostMarkdown(slug: string, frontmatter: PostFrontmatter, body: string): void {
  if (!isValidSlug(slug)) throw new Error("Invalid slug");
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  const normalizedBody = body.trim().endsWith("\n") ? body.trim() : `${body.trim()}\n`;
  const raw = matter.stringify(normalizedBody, frontmatter as Record<string, unknown>);
  fs.writeFileSync(filePath, raw, "utf8");
}

export function readPostRaw(slug: string): { frontmatter: PostFrontmatter; body: string } | null {
  if (!isValidSlug(slug)) return null;
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    frontmatter: parsed.data as unknown as PostFrontmatter,
    body: parsed.content,
  };
}

export function deletePostFile(slug: string): boolean {
  if (!isValidSlug(slug)) return false;
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}
