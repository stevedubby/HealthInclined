import { Pool } from "pg";
import type { Category } from "@/lib/categories";
import type { Post, PostFrontmatter } from "@/lib/content/posts";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      // Supabase pooler on serverless can present a chain that fails strict verification.
      // Allow TLS while skipping CA verification for this managed connection.
      ssl: { rejectUnauthorized: false },
    });
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
          content TEXT NOT NULL,
          views INTEGER NOT NULL DEFAULT 0,
          likes INTEGER NOT NULL DEFAULT 0,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TEXT,
          thumbnail_url TEXT,
          last_saved_at TEXT
        );
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TEXT;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_saved_at TEXT;
      `);
      await p.query(`
        UPDATE posts SET created_at = published_at WHERE created_at IS NULL OR created_at = '';
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
  views?: number | string | null;
  likes?: number | string | null;
  featured?: boolean | null;
  created_at?: string | null;
  thumbnail_url?: string | null;
  last_saved_at?: string | null;
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
    featured: row.featured === true ? true : undefined,
    createdAt: row.created_at?.trim() || row.published_at,
    thumbnailUrl: row.thumbnail_url?.trim() || undefined,
    lastSavedAt: row.last_saved_at?.trim() || undefined,
  };
  const views = Number(row.views ?? 0);
  const likes = Number(row.likes ?? 0);
  return {
    slug: row.slug,
    content: row.content,
    ...frontmatter,
    views: Number.isFinite(views) ? views : 0,
    likes: Number.isFinite(likes) ? likes : 0,
  };
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
  const pool = getPool();
  if (!pool) return;
  await ensureInit();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (post.featured === true) {
      await client.query(`UPDATE posts SET featured = FALSE WHERE slug <> $1`, [post.slug]);
    }

    const trimmedCreated = post.createdAt?.trim();
    let createdAtVal: string;
    if (trimmedCreated) {
      createdAtVal = trimmedCreated;
    } else {
      const prev = await client.query(`SELECT created_at FROM posts WHERE slug = $1`, [post.slug]);
      const existing = prev.rows[0]?.created_at as string | undefined;
      createdAtVal =
        existing?.trim() || new Date().toISOString();
    }

    await client.query(
      `INSERT INTO posts (
        slug, title, description, category, main_keyword, keywords, published_at, updated_at,
        published, seo_title, video_platform, video_id, video_title, related, content, views, likes,
        featured, created_at, thumbnail_url, last_saved_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,0,0,$16,$17,$18,$19
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
        content = EXCLUDED.content,
        views = posts.views,
        likes = posts.likes,
        featured = EXCLUDED.featured,
        created_at = COALESCE(NULLIF(TRIM(posts.created_at::text), ''), EXCLUDED.created_at),
        thumbnail_url = EXCLUDED.thumbnail_url,
        last_saved_at = COALESCE(EXCLUDED.last_saved_at, posts.last_saved_at)`,
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
        post.featured === true,
        createdAtVal,
        post.thumbnailUrl?.trim() || null,
        post.lastSavedAt?.trim() || null,
      ],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function dbGetFeaturedPublicPost(): Promise<Post | null> {
  const p = getPool();
  if (!p) return null;
  await ensureInit();
  const result = await p.query(
    `SELECT * FROM posts WHERE published = TRUE AND featured = TRUE
     ORDER BY COALESCE(NULLIF(TRIM(created_at::text), ''), published_at) DESC, slug ASC
     LIMIT 1`,
  );
  if (!result.rows[0]) return null;
  return mapPost(result.rows[0]);
}

export async function dbGetLatestPublicPosts(limit: number, excludeSlug?: string): Promise<Post[]> {
  const p = getPool();
  if (!p) return [];
  await ensureInit();
  const lim = Math.min(Math.max(1, Math.floor(limit)), 48);
  const ex = excludeSlug?.trim();
  const orderSql =
    "ORDER BY COALESCE(NULLIF(TRIM(created_at::text), ''), published_at) DESC NULLS LAST, slug ASC";
  const result = ex
    ? await p.query(
        `SELECT * FROM posts WHERE published = TRUE AND slug <> $1 ${orderSql} LIMIT $2`,
        [ex, lim],
      )
    : await p.query(`SELECT * FROM posts WHERE published = TRUE ${orderSql} LIMIT $1`, [lim]);
  return result.rows.map(mapPost);
}

export async function dbSearchPublicPosts(query: string, limit: number): Promise<Post[]> {
  const p = getPool();
  if (!p) return [];
  await ensureInit();
  const q = query.trim();
  if (!q) return [];
  const lim = Math.min(Math.max(1, Math.floor(limit)), 48);
  const result = await p.query(
    `SELECT * FROM posts
     WHERE published = TRUE
       AND (
         POSITION(LOWER($1::text) IN LOWER(title)) > 0
         OR POSITION(LOWER($1::text) IN LOWER(content)) > 0
       )
     ORDER BY COALESCE(NULLIF(TRIM(created_at::text), ''), published_at) DESC NULLS LAST, slug ASC
     LIMIT $2`,
    [q, lim],
  );
  return result.rows.map(mapPost);
}

export async function dbGetPublishedCountByCategory(): Promise<Record<string, number>> {
  const p = getPool();
  if (!p) return {};
  await ensureInit();
  const result = await p.query(
    `SELECT category, COUNT(*)::int AS n FROM posts WHERE published = TRUE GROUP BY category`,
  );
  const out: Record<string, number> = {};
  for (const row of result.rows as { category: string; n: number }[]) {
    out[row.category] = row.n;
  }
  return out;
}

/** Increment view count for a published post. Returns new total or null if unavailable. */
export async function dbIncrementPostView(slug: string): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureInit();
  const result = await pool.query(
    `UPDATE posts SET views = views + 1 WHERE slug = $1 AND published = TRUE RETURNING views`,
    [slug],
  );
  if (!result.rowCount) return null;
  return Number(result.rows[0].views);
}

/** Adjust like count (delta +1 or -1). Returns new total or null. */
export async function dbAdjustPostLike(slug: string, delta: 1 | -1): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;
  await ensureInit();
  const result = await pool.query(
    `UPDATE posts SET likes = GREATEST(0, likes + $2) WHERE slug = $1 AND published = TRUE RETURNING likes`,
    [slug, delta],
  );
  if (!result.rowCount) return null;
  return Number(result.rows[0].likes);
}

export async function dbDeletePost(slug: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  await ensureInit();
  const result = await p.query("DELETE FROM posts WHERE slug = $1", [slug]);
  return (result.rowCount ?? 0) > 0;
}

/** Lightweight autosave for unpublished drafts only. */
export async function dbPatchDraftAutosave(
  slug: string,
  patch: {
    title: string;
    content: string;
    category: string;
    thumbnailUrl: string | null;
    lastSavedAt: string;
  },
): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  await ensureInit();
  const result = await p.query(
    `UPDATE posts SET
      title = $2,
      content = $3,
      category = $4,
      thumbnail_url = $5,
      last_saved_at = $6,
      updated_at = $6
    WHERE slug = $1 AND published = FALSE`,
    [slug, patch.title, patch.content, patch.category, patch.thumbnailUrl, patch.lastSavedAt],
  );
  return (result.rowCount ?? 0) > 0;
}
