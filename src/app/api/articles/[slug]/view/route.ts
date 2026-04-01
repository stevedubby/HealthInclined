import { NextResponse } from "next/server";
import { dbIncrementPostView, isDatabaseEnabled } from "@/lib/db-content";
import { isValidSlug } from "@/lib/admin-posts";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ ok: false, views: null, reason: "no_database" }, { status: 503 });
  }

  try {
    const views = await dbIncrementPostView(slug);
    if (views === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, views });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
