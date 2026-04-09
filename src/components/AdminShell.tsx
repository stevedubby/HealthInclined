"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminThemeToggle from "@/components/AdminThemeToggle";
import { SITE } from "@/lib/site";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/posts/new", label: "New article", icon: "＋" },
  { href: "/admin/categories", label: "Categories", icon: "▤" },
];

function navActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/posts/new") return pathname === "/admin/posts/new";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = navActive(pathname, href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-500/30"
          : "text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
        {icon}
      </span>
      {label}
    </Link>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex">
        <div className="border-b border-zinc-200 px-5 py-6 dark:border-zinc-800">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/90">
            {SITE.name}
          </div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">Content studio</div>
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-500">Write, SEO, publish.</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="mb-3 flex justify-center">
            <AdminThemeToggle />
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center justify-center rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-600/50 dark:hover:text-emerald-300"
          >
            View live site ↗
          </Link>
          <div className="flex justify-center">
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 lg:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Admin</span>
            <div className="flex items-center gap-2">
              <AdminThemeToggle />
              <Link
                href="/admin/posts/new"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                New
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
          <nav className="flex gap-1 border-t border-zinc-200/80 px-2 py-2 dark:border-zinc-800/80">
            <Link
              href="/admin"
              className="flex-1 rounded-lg py-2 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            >
              Home
            </Link>
            <Link
              href="/admin/categories"
              className="flex-1 rounded-lg py-2 text-center text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            >
              Categories
            </Link>
          </nav>
        </header>
        <main className="flex-1 overflow-auto bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
