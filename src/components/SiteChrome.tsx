"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidePublicChrome = pathname === "/admin" || pathname?.startsWith("/admin/");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {hidePublicChrome ? (
        <div className="flex flex-1 flex-col">{children}</div>
      ) : (
        <>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
        </>
      )}
      <SiteFooter />
    </div>
  );
}
