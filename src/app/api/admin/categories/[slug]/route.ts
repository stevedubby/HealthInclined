import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategories, writeCategoriesFile, type Category } from "@/lib/categories";
import { getAllPostsAdmin } from "@/lib/content/posts";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

type UpdateBody = {
  name: string;
  shortDescription: string;
  highlight?: boolean;
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

  const list = getCategories();
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
    writeCategoriesFile(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
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

  const posts = getAllPostsAdmin();
  if (posts.some((p) => p.category === slug)) {
    return NextResponse.json(
      { error: "Cannot delete: one or more articles use this category. Reassign them first." },
      { status: 409 },
    );
  }

  const list = getCategories();
  const next = list.filter((c) => c.slug !== slug);
  if (next.length === list.length) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (next.length === 0) {
    return NextResponse.json({ error: "At least one category must remain" }, { status: 400 });
  }

  try {
    writeCategoriesFile(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
