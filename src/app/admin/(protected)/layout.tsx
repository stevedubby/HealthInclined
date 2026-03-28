import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdminSecret, verifyAdminSessionToken } from "@/lib/admin-session";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  let secret: string;
  try {
    secret = getAdminSecret();
  } catch {
    redirect("/admin/login");
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token, secret)) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
