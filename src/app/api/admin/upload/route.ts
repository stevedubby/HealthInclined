import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel, or images will embed as data URLs." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const rawName = typeof (file as File).name === "string" ? (file as File).name : "image";
  const safe = rawName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 120) || "image";
  const key = `articles/${Date.now()}-${safe}`;

  try {
    const blob = await put(key, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
