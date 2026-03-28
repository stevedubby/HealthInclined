import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/AdminThemeContext";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
