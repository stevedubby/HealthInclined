"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur dark:border-emerald-900 dark:bg-zinc-950/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
          <Link href="/" className="group inline-flex items-center gap-3">
            <Image
              src="/myhealthinclinedlogo.png"
              alt="Healthinclined logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-emerald-200 dark:ring-emerald-800"
            />
            <span className="text-lg font-extrabold tracking-tight text-emerald-900 group-hover:underline dark:text-emerald-300">
              Healthinclined
            </span>
          </Link>
          <span className="text-xs font-semibold text-emerald-700">
            In collaboration with{" "}
            <a
              href="https://recoveryhunt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-emerald-900 dark:hover:text-emerald-200"
            >
              recoveryhunt.com
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 text-zinc-800 md:hidden dark:border-emerald-800 dark:text-zinc-200"
          >
            <span className="text-lg leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-zinc-800 hover:text-emerald-800 hover:underline underline-offset-4 dark:text-zinc-200 dark:hover:text-emerald-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {mobileOpen ? (
        <div className="border-t border-emerald-100 px-4 py-3 md:hidden dark:border-emerald-900">
          <nav aria-label="Mobile primary" className="flex flex-col gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-zinc-800 hover:bg-emerald-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

