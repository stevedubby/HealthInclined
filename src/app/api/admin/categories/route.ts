import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategories, writeCategoriesFile, type Category } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  return NextResponse.json({ categories: getCategories() });
}

type CreateBody = {
  slug: string;
  name: string;
  shortDescription: string;
  highlight?: boolean;
};

export async function POST(req: Request) {
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

  const name = String(body.name ?? "").trim();
  const shortDescription = String(body.shortDescription ?? "").trim();
  if (!name || !shortDescription) {
    return NextResponse.json({ error: "name and shortDescription are required" }, { status: 400 });
  }

  const list = getCategories();
  if (list.some((c) => c.slug === slug)) {
    return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
  }

  const next: Category[] = [
    ...list,
    {
      slug,
      name,
      shortDescription,
      highlight: body.highlight === true ? true : undefined,
    },
  ];

  try {
    writeCategoriesFile(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}
