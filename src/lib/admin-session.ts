import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "hi_admin";

export function getAdminSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ADMIN_SECRET is missing or too short. Set a long random string in .env.local (16+ characters).",
    );
  }
  return s;
}

export function getAdminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p || p.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD is missing or too short. Set a strong password in .env.local (8+ characters).",
    );
  }
  return p;
}

/** Signed session: `{expSeconds}.{hexSig}` */
export function createAdminSessionToken(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const payload = String(exp);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!/^\d+$/.test(payload) || !/^[a-f0-9]{64}$/i.test(sig)) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return false;
  } catch {
    return false;
  }

  const exp = Number.parseInt(payload, 10);
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}
