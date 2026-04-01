import { Pool } from "pg";
import type { Category } from "@/lib/categories";
import type { Post, PostFrontmatter } from "@/lib/content/posts";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function ensureInit(): Promise<void> {
  const p = getPool();
  if (!p) return;
  if (!initPromise) {
    initPromise = (async () => {
      await p.query(`
        CREATE TABLE IF NOT EXISTS categories (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          short_description TEXT NOT NULL,
          highlight BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      await p.query(`
        CREATE TABLE IF NOT EXISTS posts (
          slug TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          main_keyword TEXT NOT NULL,
          keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
          published_at TEXT NOT NULL,
          updated_at TEXT,
          published BOOLEAN NOT NULL DEFAULT TRUE,
          seo_title TEXT,
          video_platform TEXT,
          video_id TEXT,
          video_title TEXT,
          related JSONB NOT NULL DEFAULT '[]'::jsonb,
          content TEXT NOT NULL
        );
      `);
    })();
  }
  await initPromise;
}

function mapCategory(row: {
  slug: string;
  name: string;
  short_description: string;
  highlight: boolean;
}): Category {
  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    highlight: row.highlight || undefined,
  };
}

function mapPost(row: {
  slug: string;
  title: string;
  description: string;
  category: string;
  main_keyword: string;
  keywords: string[] | string;
  published_at: string;
  updated_at: string | null;
  published: boolean;
  seo_title: string | null;
  video_platform: "youtube" | "tiktok" | null;
  video_id: string | null;
  video_title: string | null;
  related: Array<{ slug: string; anchor: string }> | string;
  content: string;
}): Post {
  const keywords =
    typeof row.keywords === "string" ? (JSON.parse(row.keywords) as string[]) : row.keywords;
  const related =
    typeof row.related === "string"
      ? (JSON.parse(row.related) as Array<{ slug: string; anchor: string }>)
      : row.related;
  const frontmatter: PostFrontmatter = {
    title: row.title,
    description: row.description,
    category: row.category,
    mainKeyword: row.main_keyword,
    keywords,
    publishedAt: row.published_at,
    updatedAt: row.updated_at ?? undefined,
    published: row.published ? undefined : false,
    seoTitle: row.seo_title ?? undefined,
    video:
      row.video_platform && row.video_id
        ? {
            platform: row.video_platform,
            id: row.video_id,
            title: row.video_title ?? undefined,
          }
        : undefined,
    related,
  };
  return { slug: row.slug, content: row.content, ...frontmatter };
}

export async function dbGetCategories(): Promise<Category[]> {
  const p = getPool();
  if (!p) return [];
  await ensureInit();
  const result = await p.query(
    "SELECT slug, name, short_description, highlight FROM categories ORDER BY name ASC",
  );
  return result.rows.map(mapCategory);
}

export async function dbUpsertCategories(categories: Category[]): Promise<void> {
  const p = getPool();
  if (!p) return;
  await ensureInit();
  await p.query("BEGIN");
  try {
    await p.query("DELETE FROM categories");
    for (const c of categories) {
      await p.query(
        "INSERT INTO categories (slug, name, short_description, highlight) VALUES ($1, $2, $3, $4)",
        [c.slug, c.name, c.shortDescription, c.highlight === true],
      );
    }
    await p.query("COMMIT");
  } catch (error) {
    await p.query("ROLLBACK");
    throw error;
  }
}

export async function dbGetAllPosts(): Promise<Post[]> {
  const p = getPool();
  if (!p) return [];
  await ensureInit();
  const result = await p.query(
    "SELECT * FROM posts ORDER BY published_at DESC, slug ASC",
  );
  return result.rows.map(mapPost);
}

export async function dbGetPostBySlug(slug: string): Promise<Post | null> {
  const p = getPool();
  if (!p) return null;
  await ensureInit();
  const result = await p.query("SELECT * FROM posts WHERE slug = $1 LIMIT 1", [slug]);
  if (!result.rows[0]) return null;
  return mapPost(result.rows[0]);
}

export async function dbUpsertPost(post: Post): Promise<void> {
  const p = getPool();
  if (!p) return;
  await ensureInit();
  await p.query(
    `INSERT INTO posts (
      slug, title, description, category, main_keyword, keywords, published_at, updated_at,
      published, seo_title, video_platform, video_id, video_title, related, content
    ) VALUES (
      $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      main_keyword = EXCLUDED.main_keyword,
      keywords = EXCLUDED.keywords,
      published_at = EXCLUDED.published_at,
      updated_at = EXCLUDED.updated_at,
      published = EXCLUDED.published,
      seo_title = EXCLUDED.seo_title,
      video_platform = EXCLUDED.video_platform,
      video_id = EXCLUDED.video_id,
      video_title = EXCLUDED.video_title,
      related = EXCLUDED.related,
      content = EXCLUDED.content`,
    [
      post.slug,
      post.title,
      post.description,
      post.category,
      post.mainKeyword,
      JSON.stringify(post.keywords ?? []),
      post.publishedAt,
      post.updatedAt ?? null,
      post.published !== false,
      post.seoTitle ?? null,
      post.video?.platform ?? null,
      post.video?.id ?? null,
      post.video?.title ?? null,
      JSON.stringify(post.related ?? []),
      post.content,
    ],
  );
}

export async function dbDeletePost(slug: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  await ensureInit();
  const result = await p.query("DELETE FROM posts WHERE slug = $1", [slug]);
  return (result.rowCount ?? 0) > 0;
}
