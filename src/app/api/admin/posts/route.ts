import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-api";
import type { PostFrontmatter } from "@/lib/content/posts";
import { getAllPostsAdminAsync, upsertPostAsync } from "@/lib/content/posts";
import { getPersistenceErrorMessage, hasPersistentContentStore } from "@/lib/content-paths";
import {
  isValidSlug,
  parseKeywords,
  parseRelatedLines
} from "@/lib/admin-posts";
import { getCategoriesAsync } from "@/lib/categories";
import { isValidArticleBody } from "@/lib/tiptap-article";
import { parseTikTokVideoId } from "@/lib/tiktok-id";
import { parseYoutubeVideoId } from "@/lib/youtube-id";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const posts = (await getAllPostsAdminAsync()).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    publishedAt: p.publishedAt,
    published: p.published !== false,
    seoTitle: p.seoTitle,
  }));

  return NextResponse.json({ posts });
}

type CreateBody = {
  slug: string;
  title: string;
  description: string;
  category: string;
  mainKeyword: string;
  keywordsText: string;
  publishedAt: string;
  updatedAt?: string;
  body: string;
  relatedText: string;
  /** false = draft (hidden on public site). Default true if omitted. */
  published?: boolean;
  seoTitle?: string;
  videoPlatform?: "" | "youtube" | "tiktok";
  videoId?: string;
  videoTitle?: string;
  /** Homepage featured slot (only one published post should be featured). */
  featured?: boolean;
  thumbnailUrl?: string;
};

export async function POST(req: Request) {
  if (!hasPersistentContentStore()) {
    return NextResponse.json({ error: getPersistenceErrorMessage() }, { status: 503 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase();
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Invalid slug. Use lowercase letters, numbers, and hyphens only." },
      { status: 400 },
    );
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

  const isLive = body.published !== false;

  const frontmatter: PostFrontmatter = {
    title,
    description,
    category,
    mainKeyword,
    keywords: keywords.length ? keywords : [mainKeyword],
    publishedAt,
    updatedAt: body.updatedAt?.trim() || publishedAt,
    related,
    createdAt: new Date().toISOString(),
  };

  if (body.featured === true) {
    frontmatter.featured = true;
  }

  const thumb = String(body.thumbnailUrl ?? "").trim();
  if (thumb) {
    frontmatter.thumbnailUrl = thumb;
  }

  if (!isLive) {
    frontmatter.published = false;
  }

  const seoTitle = String(body.seoTitle ?? "").trim();
  if (seoTitle) {
    frontmatter.seoTitle = seoTitle;
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
    revalidatePath("/admin");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}
