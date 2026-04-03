import { NextResponse } from "next/server";
import { dbAdjustPostLike, isDatabaseEnabled } from "@/lib/db-content";
import { isValidSlug } from "@/lib/admin-posts";
import { getPostBySlugAsync } from "@/lib/content/posts";

type Ctx = { params: Promise<{ slug: string }> };

type Body = { like?: boolean };

export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.like !== true && body.like !== false) {
    return NextResponse.json({ error: "Body must include like: true or like: false" }, { status: 400 });
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ ok: false, likes: null, reason: "no_database" }, { status: 503 });
  }

  const delta: 1 | -1 = body.like ? 1 : -1;

  try {
    const post = await getPostBySlugAsync(slug);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const likes = await dbAdjustPostLike(post.slug, delta);
    if (likes === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, likes, slug: post.slug });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
