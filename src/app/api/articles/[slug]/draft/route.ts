import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug } from "@/lib/admin-posts";
import {
  dbGetPostBySlug,
  dbPatchDraftAutosave,
  dbRenameDraftSlugOnly,
  isDatabaseEnabled,
} from "@/lib/db-content";
import { getPersistenceErrorMessage, hasPersistentContentStore } from "@/lib/content-paths";
import { getCategoriesAsync } from "@/lib/categories";
import { EMPTY_TIPTAP_DOC_JSON, isTiptapJsonContent } from "@/lib/tiptap-article";

type DraftPatchBody = {
  title?: string;
  body?: string;
  category?: string;
  thumbnailUrl?: string;
  /** Intended slug (draft rename). */
  slug?: string;
};

type Ctx = { params: Promise<{ slug: string }> };

function normalizeBodyJson(raw: string | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return EMPTY_TIPTAP_DOC_JSON;
  if (isTiptapJsonContent(t)) return t;
  return EMPTY_TIPTAP_DOC_JSON;
}

export async function PUT(req: Request, ctx: Ctx) {
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

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeURIComponent(rawSlug);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const prior = await dbGetPostBySlug(slug);
  if (!prior) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (prior.published !== false) {
    return NextResponse.json(
      { error: "Autosave is only available for drafts (unpublished articles)." },
      { status: 403 },
    );
  }

  let body: DraftPatchBody;
  try {
    body = (await req.json()) as DraftPatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categories = await getCategoriesAsync();
  const category = String(body.category ?? prior.category).trim();
  if (!categories.some((c) => c.slug === category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const title = String(body.title ?? prior.title).trim() || "Untitled draft";
  const content = body.body !== undefined ? normalizeBodyJson(body.body) : prior.content;
  const thumb =
    body.thumbnailUrl !== undefined
      ? String(body.thumbnailUrl).trim()
      : prior.thumbnailUrl?.trim() ?? "";

  let effectiveSlug = slug;
  const requested = String(body.slug ?? "").trim().toLowerCase();
  if (requested && requested !== slug) {
    if (!isValidSlug(requested)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    const renamed = await dbRenameDraftSlugOnly(slug, requested);
    if (!renamed) {
      return NextResponse.json(
        { error: "That slug is already in use or could not be renamed." },
        { status: 409 },
      );
    }
    effectiveSlug = requested;
  }

  const now = new Date();
  const lastSavedAt = now.toISOString();

  const ok = await dbPatchDraftAutosave(effectiveSlug, {
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
    slug: effectiveSlug,
    status: "draft" as const,
    lastSavedAt,
  });
}
