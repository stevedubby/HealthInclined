import { NextResponse } from "next/server";
import { getPostCategorySlugs, searchPostsPublicAsync } from "@/lib/content/posts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const posts = await searchPostsPublicAsync(q, 24);
  const results = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    categories: getPostCategorySlugs(p),
  }));

  return NextResponse.json({ results });
}
