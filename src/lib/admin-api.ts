import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminSecret, verifyAdminSessionToken } from "@/lib/admin-session";

export async function requireAdminSession(): Promise<
  { ok: true } | { ok: false; status: number; message: string }
> {
  let secret: string;
  try {
    secret = getAdminSecret();
  } catch {
    return { ok: false, status: 500, message: "Admin is not configured (ADMIN_SECRET)." };
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token, secret)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true };
}
