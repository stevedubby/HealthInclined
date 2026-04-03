import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug } from "@/lib/admin-posts";
import {
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

type DraftBody = {
  slug?: string;
  title?: string;
  body?: string;
  category?: string;
  thumbnailUrl?: string;
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
    return NextResponse.json({ error: getPersistenceErrorMessage() }, { status: 503 });
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

  const categories = await getCategoriesAsync();
  const category = String(body.category ?? "").trim();
  if (!categories.some((c) => c.slug === category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim() || "Untitled draft";
  const content = normalizeBodyJson(body.body);
  const thumb = String(body.thumbnailUrl ?? "").trim();
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
      const ok = await dbPatchDraftAutosave(want, {
        title,
        content,
        category,
        thumbnailUrl: thumb || null,
        lastSavedAt,
      });
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

  if (!draftPlainTextMeetsAutosaveThreshold(content)) {
    return NextResponse.json(
      { error: "Add at least 25 characters in the article body to create a server draft." },
      { status: 400 },
    );
  }

  const post: Post = {
    slug,
    title,
    description: "Draft — add a meta description before publishing.",
    category,
    mainKeyword: "draft",
    keywords: ["draft"],
    publishedAt: today,
    updatedAt: today,
    published: false,
    related: [],
    content,
    createdAt: now.toISOString(),
    lastSavedAt,
    thumbnailUrl: thumb || undefined,
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
