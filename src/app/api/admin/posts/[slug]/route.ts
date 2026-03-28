import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import type { PostFrontmatter } from "@/lib/content/posts";
import {
  deletePostFile,
  isValidSlug,
  parseKeywords,
  parseRelatedLines,
  readPostRaw,
  writePostMarkdown,
} from "@/lib/admin-posts";
import { getCategories } from "@/lib/categories";

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

  const data = readPostRaw(slug);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug,
    frontmatter: data.frontmatter,
    body: data.body,
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
};

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const prior = readPostRaw(slug);
  if (!prior) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = String(body.category ?? "").trim();
  if (!getCategories().some((c) => c.slug === category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const mainKeyword = String(body.mainKeyword ?? "").trim();
  const publishedAt = String(body.publishedAt ?? "").trim();
  const markdownBody = String(body.body ?? "");

  if (!title || !description || !mainKeyword || !publishedAt || !markdownBody.trim()) {
    return NextResponse.json(
      { error: "title, description, mainKeyword, publishedAt, and body are required" },
      { status: 400 },
    );
  }

  const keywords = parseKeywords(String(body.keywordsText ?? ""));
  const related = parseRelatedLines(String(body.relatedText ?? ""));

  const isLive =
    body.published === undefined
      ? prior.frontmatter.published !== false
      : body.published === true;

  const frontmatter: PostFrontmatter = {
    title,
    description,
    category,
    mainKeyword,
    keywords: keywords.length ? keywords : [mainKeyword],
    publishedAt,
    updatedAt: body.updatedAt?.trim() || publishedAt,
    related,
  };

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
  const vid = String(body.videoId ?? "").trim();
  if (vp && vid) {
    frontmatter.video = {
      platform: vp,
      id: vid,
      title: body.videoTitle?.trim() || undefined,
    };
  }

  try {
    writePostMarkdown(slug, frontmatter, markdownBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}

/** Toggle visibility without re-sending the full article body. */
export async function PATCH(req: Request, ctx: Ctx) {
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

  const prior = readPostRaw(slug);
  if (!prior) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextFm: PostFrontmatter = { ...prior.frontmatter };
  if (body.published === false) {
    nextFm.published = false;
  } else {
    delete nextFm.published;
  }

  try {
    writePostMarkdown(slug, nextFm, prior.body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, published: body.published === true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const ok = deletePostFile(slug);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
