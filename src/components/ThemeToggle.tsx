"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark and light mode"
      className="inline-flex h-9 items-center rounded-full border border-emerald-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

