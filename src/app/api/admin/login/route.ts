import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
  getAdminSecret,
} from "@/lib/admin-session";

export async function POST(req: Request) {
  let secret: string;
  let expectedPassword: string;
  try {
    secret = getAdminSecret();
    expectedPassword = getAdminPassword();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured. Set ADMIN_SECRET and ADMIN_PASSWORD in .env.local" },
      { status: 500 },
    );
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createAdminSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
