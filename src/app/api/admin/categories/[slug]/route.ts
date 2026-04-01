import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategoriesAsync, saveCategoriesAsync, type Category } from "@/lib/categories";
import { getAllPostsAdminAsync } from "@/lib/content/posts";
import { getPersistenceErrorMessage, hasPersistentContentStore } from "@/lib/content-paths";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

type UpdateBody = {
  name: string;
  shortDescription: string;
  highlight?: boolean;
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

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const shortDescription = String(body.shortDescription ?? "").trim();
  if (!name || !shortDescription) {
    return NextResponse.json({ error: "name and shortDescription are required" }, { status: 400 });
  }

  const list = await getCategoriesAsync();
  const idx = list.findIndex((c) => c.slug === slug);
  if (idx === -1) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updated: Category = {
    slug,
    name,
    shortDescription,
    highlight: body.highlight === true ? true : undefined,
  };

  const next = [...list];
  next[idx] = updated;

  try {
    await saveCategoriesAsync(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
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

  const posts = await getAllPostsAdminAsync();
  if (posts.some((p) => p.category === slug)) {
    return NextResponse.json(
      { error: "Cannot delete: one or more articles use this category. Reassign them first." },
      { status: 409 },
    );
  }

  const list = await getCategoriesAsync();
  const next = list.filter((c) => c.slug !== slug);
  if (next.length === list.length) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (next.length === 0) {
    return NextResponse.json({ error: "At least one category must remain" }, { status: 400 });
  }

  try {
    await saveCategoriesAsync(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
