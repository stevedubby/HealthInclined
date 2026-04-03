import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-api";
import type { PostFrontmatter } from "@/lib/content/posts";
import {
  isValidSlug,
  parseKeywords,
  parseRelatedLines
} from "@/lib/admin-posts";
import { deletePostAsync, getPostBySlugAdminAsync, upsertPostAsync } from "@/lib/content/posts";
import { getCategoriesAsync } from "@/lib/categories";
import { getPersistenceErrorMessage, hasPersistentContentStore } from "@/lib/content-paths";
import { isValidArticleBody } from "@/lib/tiptap-article";
import { parseTikTokVideoId } from "@/lib/tiktok-id";
import { parseYoutubeVideoId } from "@/lib/youtube-id";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const data = await getPostBySlugAdminAsync(slug);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug,
    frontmatter: {
      title: data.title,
      description: data.description,
      category: data.category,
      mainKeyword: data.mainKeyword,
      keywords: data.keywords,
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt,
      published: data.published,
      seoTitle: data.seoTitle,
      video: data.video,
      related: data.related,
      featured: data.featured,
      createdAt: data.createdAt,
      thumbnailUrl: data.thumbnailUrl,
      lastSavedAt: data.lastSavedAt,
      status: data.published === false ? ("draft" as const) : ("published" as const),
    },
    body: data.content,
  });
}

type UpdateBody = {
  title: string;
  description: string;
  category: string;
  mainKeyword: string;
  keywordsText: string;
  publishedAt: string;
  updatedAt?: string;
  body: string;
  relatedText: string;
  /** false = draft, true = live. Omit = keep current visibility. */
  published?: boolean;
  seoTitle?: string;
  videoPlatform?: "" | "youtube" | "tiktok";
  videoId?: string;
  videoTitle?: string;
  featured?: boolean;
  createdAt?: string;
  thumbnailUrl?: string;
};

export async function PUT(req: Request, ctx: Ctx) {
  if (!hasPersistentContentStore()) {
    return NextResponse.json({ error: getPersistenceErrorMessage() }, { status: 503 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const prior = await getPostBySlugAdminAsync(slug);
  if (!prior) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const priorCategory = prior.category;

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = String(body.category ?? "").trim();
  if (!(await getCategoriesAsync()).some((c) => c.slug === category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const mainKeyword = String(body.mainKeyword ?? "").trim();
  const publishedAt = String(body.publishedAt ?? "").trim();
  const articleBody = String(body.body ?? "");

  if (!title || !description || !mainKeyword || !publishedAt || !isValidArticleBody(articleBody)) {
    return NextResponse.json(
      {
        error:
          "title, description, mainKeyword, publishedAt, and a non-empty article body (visual editor JSON) are required",
      },
      { status: 400 },
    );
  }

  const keywords = parseKeywords(String(body.keywordsText ?? ""));
  const related = parseRelatedLines(String(body.relatedText ?? ""));

  const isLive =
    body.published === undefined
      ? prior.published !== false
      : body.published === true;

  const createdAtPersist =
    String(body.createdAt ?? "").trim() || prior.createdAt || prior.publishedAt;

  const frontmatter: PostFrontmatter = {
    title,
    description,
    category,
    mainKeyword,
    keywords: keywords.length ? keywords : [mainKeyword],
    publishedAt,
    updatedAt: body.updatedAt?.trim() || publishedAt,
    related,
    createdAt: createdAtPersist,
    lastSavedAt: prior.lastSavedAt,
  };

  const featuredNext =
    body.featured === undefined ? prior.featured === true : body.featured === true;
  if (featuredNext) {
    frontmatter.featured = true;
  } else {
    delete frontmatter.featured;
  }

  const thumb = String(body.thumbnailUrl ?? "").trim();
  if (thumb) {
    frontmatter.thumbnailUrl = thumb;
  } else {
    delete frontmatter.thumbnailUrl;
  }

  if (!isLive) {
    frontmatter.published = false;
  }

  const seoTitle = String(body.seoTitle ?? "").trim();
  if (seoTitle) {
    frontmatter.seoTitle = seoTitle;
  } else {
    delete frontmatter.seoTitle;
  }

  const vp = body.videoPlatform;
  const vidRaw = String(body.videoId ?? "").trim();
  if (vp && vidRaw) {
    if (vp === "youtube") {
      const vid = parseYoutubeVideoId(vidRaw);
      if (!vid) {
        return NextResponse.json(
          {
            error:
              "Invalid YouTube URL or ID. Paste a Shorts link, watch URL (with v=), youtu.be link, or the 11-character video ID.",
          },
          { status: 400 },
        );
      }
      frontmatter.video = {
        platform: vp,
        id: vid,
        title: body.videoTitle?.trim() || undefined,
      };
    } else if (vp === "tiktok") {
      const vid = parseTikTokVideoId(vidRaw);
      if (!vid) {
        return NextResponse.json(
          {
            error:
              "Invalid TikTok URL or ID. Paste the full video URL (must contain /video/ and the numeric ID) or paste the numeric video ID only.",
          },
          { status: 400 },
        );
      }
      frontmatter.video = {
        platform: vp,
        id: vid,
        title: body.videoTitle?.trim() || undefined,
      };
    } else {
      frontmatter.video = {
        platform: vp,
        id: vidRaw,
        title: body.videoTitle?.trim() || undefined,
      };
    }
  }

  try {
    await upsertPostAsync({ slug, content: articleBody, ...frontmatter });
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/videos");
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/category/${frontmatter.category}`);
    if (frontmatter.category !== priorCategory) {
      revalidatePath(`/category/${priorCategory}`);
    }
    revalidatePath("/admin");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}

/** Toggle visibility without re-sending the full article body. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!hasPersistentContentStore()) {
    return NextResponse.json({ error: getPersistenceErrorMessage() }, { status: 503 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: { published?: boolean };
  try {
    body = (await req.json()) as { published?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.published !== true && body.published !== false) {
    return NextResponse.json({ error: "published must be true or false" }, { status: 400 });
  }

  const prior = await getPostBySlugAdminAsync(slug);
  if (!prior) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextFm: PostFrontmatter = {
    title: prior.title,
    description: prior.description,
    category: prior.category,
    mainKeyword: prior.mainKeyword,
    keywords: prior.keywords,
    publishedAt: prior.publishedAt,
    updatedAt: prior.updatedAt,
    published: prior.published,
    seoTitle: prior.seoTitle,
    video: prior.video,
    related: prior.related,
    featured: prior.featured,
    createdAt: prior.createdAt ?? prior.publishedAt,
    thumbnailUrl: prior.thumbnailUrl,
    lastSavedAt: prior.lastSavedAt,
  };
  if (body.published === false) {
    nextFm.published = false;
  } else {
    delete nextFm.published;
  }

  try {
    await upsertPostAsync({ slug, content: prior.content, ...nextFm });
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/videos");
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/category/${prior.category}`);
    revalidatePath("/admin");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, published: body.published === true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!hasPersistentContentStore()) {
    return NextResponse.json({ error: getPersistenceErrorMessage() }, { status: 503 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const prior = await getPostBySlugAdminAsync(slug);
  const ok = await deletePostAsync(slug);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/videos");
  revalidatePath(`/blog/${slug}`);
  if (prior?.category) {
    revalidatePath(`/category/${prior.category}`);
  }
  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
