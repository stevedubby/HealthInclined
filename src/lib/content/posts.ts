import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { dbDeletePost, dbGetAllPosts, dbGetPostBySlug, dbUpsertPost, isDatabaseEnabled } from "@/lib/db-content";
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
      if (!post || post.published === false) return null;
      return post;
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
  return posts.filter((p) => p.category === categorySlug);
}

export async function upsertPostAsync(post: Post): Promise<void> {
  if (isDatabaseEnabled()) {
    await dbUpsertPost(post);
    return;
  }
  // file fallback for local mode
  const matterPayload = {
    title: post.title,
    description: post.description,
    category: post.category,
    mainKeyword: post.mainKeyword,
    keywords: post.keywords,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    published: post.published,
    seoTitle: post.seoTitle,
    video: post.video,
    related: post.related,
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
