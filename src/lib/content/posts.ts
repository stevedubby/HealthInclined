import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  dbDeletePost,
  dbGetAllPosts,
  dbGetFeaturedPublicPost,
  dbGetLatestPublicPosts,
  dbGetPostBySlug,
  dbGetPublishedPostByLegacySlug,
  dbGetPublishedCountByCategory,
  dbSearchPublicPosts,
  dbUpsertPost,
  isDatabaseEnabled,
} from "@/lib/db-content";
import { getReadContentRoots, getWritableContentRoot } from "@/lib/content-paths";

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
  /** Primary category slug (first in `categories`; kept for backward compatibility). */
  category: string;
  /** All category slugs for this article (non-empty when loaded from DB or normalized). */
  categories?: string[];
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
  /** Homepage spotlight (database); only one published post should be featured. */
  featured?: boolean;
  /** Creation / sort time (ISO string); falls back to `publishedAt` when unset. */
  createdAt?: string;
  /** Optional card image URL (database). */
  thumbnailUrl?: string;
  /** ISO timestamp of last autosave (database). */
  lastSavedAt?: string;
};

export type Post = PostFrontmatter & {
  slug: string;
  content: string;
  /** Normalized category slugs (at least one when the article is valid). */
  categories: string[];
  /** Page views (database-backed; omit or 0 when file-only / new draft). */
  views?: number;
  /** Like count (database-backed; omit or 0 when file-only / new draft). */
  likes?: number;
  /** Previous public slugs (database); used for redirects after rename. */
  slugHistory?: string[];
};

/** Build category slug list from frontmatter (`categories` array or legacy `category`). */
export function normalizeArticleCategories(
  categories: unknown,
  category: string | undefined,
): string[] {
  if (Array.isArray(categories)) {
    const list = categories.map((x) => String(x).trim()).filter(Boolean);
    if (list.length) return list;
  }
  const c = category?.trim();
  return c ? [c] : [];
}

export function getPostCategorySlugs(post: Post): string[] {
  if (post.categories?.length) return post.categories;
  return post.category ? [post.category] : [];
}

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
    const categories = normalizeArticleCategories(frontmatter.categories, frontmatter.category);
    const primary = categories[0] ?? frontmatter.category?.trim() ?? "";
    return {
      slug,
      content,
      ...frontmatter,
      category: primary,
      categories: categories.length ? categories : primary ? [primary] : [],
      featured: frontmatter.featured === true ? true : undefined,
      createdAt: frontmatter.createdAt?.trim() || frontmatter.publishedAt,
      thumbnailUrl: frontmatter.thumbnailUrl?.trim() || undefined,
      views: 0,
      likes: 0,
    };
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
  throw new Error("Use getAllPostsAsync() instead.");
}

/** All posts including drafts — admin only. */
export function getAllPostsAdmin(): Post[] {
  throw new Error("Use getAllPostsAdminAsync() instead.");
}

export async function getAllPostsAsync(): Promise<Post[]> {
  if (isDatabaseEnabled()) {
    try {
      let posts = await dbGetAllPosts();
      if (posts.length === 0) {
        const filePosts = loadAllPostsFromDisk();
        for (const post of filePosts) {
          await dbUpsertPost(post);
        }
        posts = filePosts;
      }
      return posts.filter((p) => p.published !== false);
    } catch {
      // Keep public pages buildable even if DB is momentarily unreachable.
      return loadAllPostsFromDisk().filter((p) => p.published !== false);
    }
  }
  return loadAllPostsFromDisk().filter((p) => p.published !== false);
}

export async function getAllPostsAdminAsync(): Promise<Post[]> {
  if (isDatabaseEnabled()) {
    try {
      let posts = await dbGetAllPosts();
      if (posts.length === 0) {
        const filePosts = loadAllPostsFromDisk();
        for (const post of filePosts) {
          await dbUpsertPost(post);
        }
        posts = filePosts;
      }
      return posts;
    } catch {
      return loadAllPostsFromDisk();
    }
  }
  return loadAllPostsFromDisk();
}

export async function getPostBySlugAsync(slug: string): Promise<Post | null> {
  if (isDatabaseEnabled()) {
    try {
      const post = await dbGetPostBySlug(slug);
      if (post && post.published !== false) return post;
      const legacy = await dbGetPublishedPostByLegacySlug(slug);
      if (legacy) return legacy;
      return null;
    } catch {
      const post = loadPostFromDisk(slug);
      if (!post || post.published === false) return null;
      return post;
    }
  }
  const post = loadPostFromDisk(slug);
  if (!post || post.published === false) return null;
  return post;
}

export async function getPostBySlugAdminAsync(slug: string): Promise<Post | null> {
  if (isDatabaseEnabled()) {
    try {
      return await dbGetPostBySlug(slug);
    } catch {
      return loadPostFromDisk(slug);
    }
  }
  return loadPostFromDisk(slug);
}

export async function getPostsByCategoryAsync(categorySlug: string): Promise<Post[]> {
  const posts = await getAllPostsAsync();
  return posts.filter((p) => getPostCategorySlugs(p).includes(categorySlug));
}

export async function upsertPostAsync(
  post: Post,
  options?: { previousSlug?: string },
): Promise<void> {
  if (isDatabaseEnabled()) {
    await dbUpsertPost(post);
    return;
  }
  const prev = options?.previousSlug?.trim();
  if (prev && prev !== post.slug) {
    for (const root of getReadContentRoots()) {
      const oldPath = path.join(root, "blog", `${prev}.md`);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          /* ignore */
        }
      }
    }
    try {
      const writable = path.join(getWritableContentRoot(), "blog", `${prev}.md`);
      if (fs.existsSync(writable)) fs.unlinkSync(writable);
    } catch {
      /* ignore */
    }
  }
  // file fallback for local mode
  const cats = post.categories?.length ? post.categories : post.category ? [post.category] : [];
  const matterPayload = {
    title: post.title,
    description: post.description,
    category: post.category || cats[0] || "",
    categories: cats.length ? cats : undefined,
    mainKeyword: post.mainKeyword,
    keywords: post.keywords,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    published: post.published,
    seoTitle: post.seoTitle,
    video: post.video,
    related: post.related,
    featured: post.featured === true ? true : undefined,
    createdAt: post.createdAt,
    thumbnailUrl: post.thumbnailUrl,
    lastSavedAt: post.lastSavedAt,
  } satisfies PostFrontmatter;
  const raw = matter.stringify(post.content.trim() + "\n", matterPayload as Record<string, unknown>);
  const dir = path.join(process.cwd(), "content", "blog");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${post.slug}.md`), raw, "utf8");
}

export async function deletePostAsync(slug: string): Promise<boolean> {
  if (isDatabaseEnabled()) return dbDeletePost(slug);
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function sortPostsByNewest(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const ta = new Date(a.createdAt ?? a.publishedAt).getTime();
    const tb = new Date(b.createdAt ?? b.publishedAt).getTime();
    return tb - ta;
  });
}

/** Single published post marked featured (admin). */
export async function getFeaturedPostAsync(): Promise<Post | null> {
  if (isDatabaseEnabled()) {
    try {
      const p = await dbGetFeaturedPublicPost();
      if (p) return p;
    } catch {
      /* fall through */
    }
  }
  const posts = loadAllPostsFromDisk().filter((p) => p.published !== false && p.featured === true);
  return sortPostsByNewest(posts)[0] ?? null;
}

/** Latest published posts by `createdAt` (fallback `publishedAt`). */
export async function getLatestPublicPostsAsync(
  limit: number,
  excludeSlug?: string,
): Promise<Post[]> {
  if (isDatabaseEnabled()) {
    try {
      return await dbGetLatestPublicPosts(limit, excludeSlug);
    } catch {
      /* fall through */
    }
  }
  let list = loadAllPostsFromDisk().filter((p) => p.published !== false);
  if (excludeSlug) list = list.filter((p) => p.slug !== excludeSlug);
  return sortPostsByNewest(list).slice(0, limit);
}

/** Case-insensitive match on title + raw article body (TipTap JSON or text). */
export async function searchPostsPublicAsync(query: string, limit = 20): Promise<Post[]> {
  const q = query.trim();
  if (!q) return [];
  if (isDatabaseEnabled()) {
    try {
      return await dbSearchPublicPosts(q, limit);
    } catch {
      /* fall through */
    }
  }
  const lower = q.toLowerCase();
  return loadAllPostsFromDisk()
    .filter((p) => p.published !== false)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lower) || p.content.toLowerCase().includes(lower),
    )
    .slice(0, limit);
}

/** Published article counts keyed by category slug. */
export async function getPublishedArticleCountsByCategoryAsync(): Promise<Record<string, number>> {
  if (isDatabaseEnabled()) {
    try {
      return await dbGetPublishedCountByCategory();
    } catch {
      /* fall through */
    }
  }
  const counts: Record<string, number> = {};
  for (const p of loadAllPostsFromDisk()) {
    if (p.published === false) continue;
    for (const c of getPostCategorySlugs(p)) {
      counts[c] = (counts[c] ?? 0) + 1;
    }
  }
  return counts;
}
