import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getReadContentRoots } from "@/lib/content-paths";

export type VideoSpec = {
  platform: "youtube" | "tiktok";
  id: string;
  title?: string;
};

export type RelatedLink = {
  slug: string;
  anchor: string;
};

export type PostFrontmatter = {
  title: string;
  description: string;
  category: string;
  mainKeyword: string;
  keywords: string[];
  publishedAt: string;
  updatedAt?: string;
  /** false = draft (hidden on public site). Omit or true = live. */
  published?: boolean;
  /** Optional Google title override (meta & Open Graph). Falls back to `title`. */
  seoTitle?: string;
  video?: VideoSpec;
  related: RelatedLink[];
};

export type Post = PostFrontmatter & {
  slug: string;
  content: string;
};

function readPostFile(filePath: string): { frontmatter: PostFrontmatter; content: string } {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);

  const frontmatter = parsed.data as unknown as PostFrontmatter;
  return { frontmatter, content: parsed.content };
}

export function getAllPostSlugs(): string[] {
  const seen = new Set<string>();
  for (const root of getReadContentRoots()) {
    const dir = path.join(root, "blog");
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      seen.add(name.replace(/\.md$/, ""));
    }
  }
  return Array.from(seen);
}

function loadPostFromDisk(slug: string): Post | null {
  for (const root of getReadContentRoots()) {
    const filePath = path.join(root, "blog", `${slug}.md`);
    if (!fs.existsSync(filePath)) continue;
    const { frontmatter, content } = readPostFile(filePath);
    return { slug, content, ...frontmatter };
  }
  return null;
}

function loadAllPostsFromDisk(): Post[] {
  const slugs = getAllPostSlugs();
  const posts: Post[] = [];
  for (const slug of slugs) {
    const p = loadPostFromDisk(slug);
    if (p) posts.push(p);
  }
  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Live posts only (excludes drafts). Use for the public site, sitemap, and RSS. */
export function getAllPosts(): Post[] {
  return loadAllPostsFromDisk().filter((p) => p.published !== false);
}

/** All posts including drafts — admin only. */
export function getAllPostsAdmin(): Post[] {
  return loadAllPostsFromDisk();
}

export function getPostBySlug(slug: string): Post | null {
  const post = loadPostFromDisk(slug);
  if (!post || post.published === false) return null;
  return post;
}

export function getPostsByCategory(categorySlug: string): Post[] {
  return getAllPosts().filter((p) => p.category === categorySlug);
}
