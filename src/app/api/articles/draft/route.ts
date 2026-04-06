import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug, parseAdminArticleCategories } from "@/lib/admin-posts";
import {
  type DraftAutosavePatch,
  dbGetPostBySlug,
  dbPatchDraftAutosave,
  dbUpsertPost,
  isDatabaseEnabled,
} from "@/lib/db-content";
import type { Post } from "@/lib/content/posts";
import { getPersistenceErrorMessage, hasPersistentContentStore } from "@/lib/content-paths";
import { getCategoriesAsync } from "@/lib/categories";
import {
  draftPlainTextMeetsAutosaveThreshold,
  EMPTY_TIPTAP_DOC_JSON,
  isTiptapJsonContent,
} from "@/lib/tiptap-article";
import { resolveDraftAutosaveVideo } from "@/lib/draft-video";

type DraftBody = {
  slug?: string;
  title?: string;
  body?: string;
  category?: string;
  categories?: string[];
  thumbnailUrl?: string;
  videoPlatform?: "" | "youtube" | "tiktok";
  videoId?: string;
  videoTitle?: string;
};

function normalizeBodyJson(raw: string | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return EMPTY_TIPTAP_DOC_JSON;
  if (isTiptapJsonContent(t)) return t;
  return EMPTY_TIPTAP_DOC_JSON;
}

async function allocateDraftSlug(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const s = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    if (!isValidSlug(s)) continue;
    const taken = await dbGetPostBySlug(s);
    if (!taken) return s;
  }
  throw new Error("Could not allocate a unique draft slug");
}

export async function POST(req: Request) {
  if (!hasPersistentContentStore()) {
    return NextResponse.json(
      { error: getPersistenceErrorMessage(), code: "NO_PERSISTENT_STORE" },
      { status: 503 },
    );
  }
  if (!isDatabaseEnabled()) {
    return NextResponse.json(
      { error: "Database is required for server draft autosave.", code: "NO_DATABASE" },
      { status: 503 },
    );
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let body: DraftBody;
  try {
    body = (await req.json()) as DraftBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const catalog = await getCategoriesAsync();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const lastSavedAt = now.toISOString();

  const want = String(body.slug ?? "")
    .trim()
    .toLowerCase();

  let slug: string;

  if (want && isValidSlug(want)) {
    const existing = await dbGetPostBySlug(want);
    if (existing && existing.published !== false) {
      return NextResponse.json(
        { error: "That slug is already used by a published article." },
        { status: 409 },
      );
    }
    if (existing) {
      const patch: DraftAutosavePatch = { lastSavedAt };
      if (body.title !== undefined) {
        const t = String(body.title).trim();
        if (t) patch.title = t;
      }
      if (body.body !== undefined) {
        patch.content = normalizeBodyJson(body.body);
      }
      if (body.thumbnailUrl !== undefined) {
        patch.thumbnailUrl = String(body.thumbnailUrl).trim() || null;
      }
      if ("categories" in body || "category" in body) {
        const parsed = parseAdminArticleCategories(body, catalog);
        if (!parsed.ok) {
          return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        patch.categories = parsed.slugs;
      }
      const videoResolved = resolveDraftAutosaveVideo(body);
      if (videoResolved !== undefined) {
        patch.video = videoResolved;
      }

      const ok = await dbPatchDraftAutosave(want, patch);
      if (!ok) {
        return NextResponse.json({ error: "Could not update draft" }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        slug: want,
        status: "draft" as const,
        lastSavedAt,
      });
    }
    slug = want;
  } else {
    slug = await allocateDraftSlug();
  }

  const content = normalizeBodyJson(body.body);
  if (!draftPlainTextMeetsAutosaveThreshold(content)) {
    return NextResponse.json(
      { error: "Add at least 25 characters in the article body to create a server draft." },
      { status: 400 },
    );
  }

  const parsedCats = parseAdminArticleCategories(body, catalog);
  if (!parsedCats.ok) {
    return NextResponse.json({ error: parsedCats.error }, { status: 400 });
  }
  const categorySlugs = parsedCats.slugs;

  const titleRaw = String(body.title ?? "").trim();
  const title = titleRaw || "Untitled draft";
  const thumb = String(body.thumbnailUrl ?? "").trim();

  const videoResolved = resolveDraftAutosaveVideo(body);
  const post: Post = {
    slug,
    title,
    description: "",
    category: categorySlugs[0],
    categories: categorySlugs,
    mainKeyword: "",
    keywords: [],
    publishedAt: today,
    updatedAt: today,
    published: false,
    related: [],
    content,
    createdAt: now.toISOString(),
    lastSavedAt,
    thumbnailUrl: thumb || undefined,
    ...(videoResolved ? { video: videoResolved } : {}),
  };

  try {
    await dbUpsertPost(post);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    slug,
    status: "draft" as const,
    lastSavedAt,
  });
}
