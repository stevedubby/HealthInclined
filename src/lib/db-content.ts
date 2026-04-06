import { Pool } from "pg";
import type { Category } from "@/lib/categories";
import type { Post, PostFrontmatter, VideoSpec } from "@/lib/content/posts";
import { getDatabaseConnectionString } from "@/lib/env-database";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  const url = getDatabaseConnectionString();
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
  return Boolean(getDatabaseConnectionString());
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
          last_saved_at TEXT,
          slug_history JSONB NOT NULL DEFAULT '[]'::jsonb
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
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug_history JSONB NOT NULL DEFAULT '[]'::jsonb;
      `);
      await p.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS categories JSONB;
      `);
      await p.query(`
        UPDATE posts SET categories = jsonb_build_array(category)
        WHERE categories IS NULL;
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

function parseCategoriesFromRow(
  categories: unknown,
  fallbackCategory: string,
): string[] {
  if (categories != null) {
    const raw =
      typeof categories === "string" ? (JSON.parse(categories) as unknown) : categories;
    if (Array.isArray(raw)) {
      const list = raw.map((x) => String(x).trim()).filter(Boolean);
      if (list.length) return list;
    }
  }
  return fallbackCategory.trim() ? [fallbackCategory.trim()] : [];
}

function mapPost(row: {
  slug: string;
  title: string;
  description: string;
  category: string;
  categories?: unknown;
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
  slug_history?: unknown;
}): Post {
  const keywords =
    typeof row.keywords === "string" ? (JSON.parse(row.keywords) as string[]) : row.keywords;
  const related =
    typeof row.related === "string"
      ? (JSON.parse(row.related) as Array<{ slug: string; anchor: string }>)
      : row.related;
  const categoriesList = parseCategoriesFromRow(row.categories, row.category);
  const primaryCategory = categoriesList[0] ?? row.category;
  const frontmatter: PostFrontmatter = {
    title: row.title,
    description: row.description,
    category: primaryCategory,
    categories: categoriesList,
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
  let slugHistory: string[] | undefined;
  if (row.slug_history != null) {
    const raw =
      typeof row.slug_history === "string"
        ? (JSON.parse(row.slug_history) as unknown)
        : row.slug_history;
    if (Array.isArray(raw)) {
      const list = raw.map((x) => String(x)).filter(Boolean);
      if (list.length) slugHistory = list;
    }
  }
  return {
    slug: row.slug,
    content: row.content,
    ...frontmatter,
    categories: categoriesList.length ? categoriesList : row.category ? [row.category] : [],
    views: Number.isFinite(views) ? views : 0,
    likes: Number.isFinite(likes) ? likes : 0,
    slugHistory,
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

/** Published post whose `slug_history` contains `legacySlug` (not the current slug). */
export async function dbGetPublishedPostByLegacySlug(legacySlug: string): Promise<Post | null> {
  const p = getPool();
  if (!p) return null;
  await ensureInit();
  const result = await p.query(
    `SELECT * FROM posts
     WHERE published = TRUE
       AND slug <> $1
       AND EXISTS (
         SELECT 1
         FROM jsonb_array_elements_text(COALESCE(slug_history, '[]'::jsonb)) AS h
         WHERE h = $1
       )
     LIMIT 1`,
    [legacySlug],
  );
  if (!result.rows[0]) return null;
  return mapPost(result.rows[0]);
}

/** Rename primary key `slug`; optionally append old slug to `slug_history` (published SEO redirects). */
export async function dbRenamePostSlug(
  oldSlug: string,
  newSlug: string,
  recordHistory: boolean,
): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("Database unavailable");
  await ensureInit();
  const dup = await pool.query("SELECT 1 FROM posts WHERE slug = $1 LIMIT 1", [newSlug]);
  if (dup.rows.length > 0) {
    throw new Error("SLUG_IN_USE");
  }
  const r = await pool.query(
    `UPDATE posts SET
      slug = $2,
      slug_history = CASE
        WHEN $3::boolean THEN COALESCE(slug_history, '[]'::jsonb) || jsonb_build_array($1::text)
        ELSE COALESCE(slug_history, '[]'::jsonb)
      END
    WHERE slug = $1`,
    [oldSlug, newSlug, recordHistory],
  );
  if ((r.rowCount ?? 0) === 0) {
    throw new Error("Post not found for slug rename");
  }
}

/** Draft-only slug change (no history). */
export async function dbRenameDraftSlugOnly(oldSlug: string, newSlug: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  await ensureInit();
  const dup = await p.query("SELECT 1 FROM posts WHERE slug = $1 LIMIT 1", [newSlug]);
  if (dup.rows.length > 0) return false;
  const r = await p.query(
    `UPDATE posts SET slug = $2 WHERE slug = $1 AND published = FALSE`,
    [oldSlug, newSlug],
  );
  return (r.rowCount ?? 0) > 0;
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

    const cats =
      post.categories?.length ? post.categories : post.category ? [post.category] : [];
    const categoryCol = cats[0] ?? post.category;
    const categoriesJson = JSON.stringify(cats.length ? cats : [post.category]);

    await client.query(
      `INSERT INTO posts (
        slug, title, description, category, categories, main_keyword, keywords, published_at, updated_at,
        published, seo_title, video_platform, video_id, video_title, related, content, views, likes,
        featured, created_at, thumbnail_url, last_saved_at, slug_history
      ) VALUES (
        $1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,0,0,$17,$18,$19,$20,'[]'::jsonb
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        categories = EXCLUDED.categories,
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
        last_saved_at = COALESCE(EXCLUDED.last_saved_at, posts.last_saved_at),
        slug_history = posts.slug_history`,
      [
        post.slug,
        post.title,
        post.description,
        categoryCol,
        categoriesJson,
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
  const result = await p.query(`
    SELECT cat_slug AS category, COUNT(*)::int AS n
    FROM posts,
    LATERAL jsonb_array_elements_text(
      CASE
        WHEN categories IS NOT NULL
          AND jsonb_typeof(categories) = 'array'
          AND jsonb_array_length(categories) > 0
        THEN categories
        ELSE jsonb_build_array(category)
      END
    ) AS t(cat_slug)
    WHERE published = TRUE AND TRIM(t.cat_slug) <> ''
    GROUP BY cat_slug
  `);
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

/** Partial fields for draft autosave — omitted keys are left unchanged in the database. */
export type DraftAutosavePatch = {
  lastSavedAt: string;
  title?: string;
  content?: string;
  category?: string;
  categories?: string[];
  thumbnailUrl?: string | null;
  /** Set or clear video columns (`null` clears). Omit to leave unchanged. */
  video?: VideoSpec | null;
};

/** Lightweight autosave for unpublished drafts only (partial UPDATE). */
export async function dbPatchDraftAutosave(
  slug: string,
  patch: DraftAutosavePatch,
): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  await ensureInit();
  const sets: string[] = ["last_saved_at = $1", "updated_at = $1"];
  const vals: unknown[] = [patch.lastSavedAt];
  let i = 2;

  if (patch.title !== undefined) {
    const t = String(patch.title).trim();
    if (t) {
      sets.push(`title = $${i}`);
      vals.push(t);
      i++;
    }
  }
  if (patch.content !== undefined) {
    sets.push(`content = $${i}`);
    vals.push(patch.content);
    i++;
  }
  if (patch.categories !== undefined && patch.categories.length > 0) {
    sets.push(`categories = $${i}::jsonb`);
    vals.push(JSON.stringify(patch.categories));
    i++;
    sets.push(`category = $${i}`);
    vals.push(patch.categories[0]);
    i++;
  } else if (patch.category !== undefined) {
    const c = String(patch.category).trim();
    if (c) {
      sets.push(`category = $${i}`);
      vals.push(c);
      i++;
      sets.push(`categories = $${i}::jsonb`);
      vals.push(JSON.stringify([c]));
      i++;
    }
  }
  if (patch.thumbnailUrl !== undefined) {
    sets.push(`thumbnail_url = $${i}`);
    vals.push(patch.thumbnailUrl);
    i++;
  }
  if (patch.video !== undefined) {
    if (patch.video === null) {
      sets.push(`video_platform = $${i}`);
      vals.push(null);
      i++;
      sets.push(`video_id = $${i}`);
      vals.push(null);
      i++;
      sets.push(`video_title = $${i}`);
      vals.push(null);
      i++;
    } else {
      sets.push(`video_platform = $${i}`);
      vals.push(patch.video.platform);
      i++;
      sets.push(`video_id = $${i}`);
      vals.push(patch.video.id);
      i++;
      sets.push(`video_title = $${i}`);
      vals.push(patch.video.title ?? null);
      i++;
    }
  }

  vals.push(slug);
  const result = await p.query(
    `UPDATE posts SET ${sets.join(", ")} WHERE slug = $${i} AND published = FALSE`,
    vals,
  );
  return (result.rowCount ?? 0) > 0;
}
