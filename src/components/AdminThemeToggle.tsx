"use client";

import { useAdminTheme } from "@/components/AdminThemeContext";

export default function AdminThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useAdminTheme();

  return (
    <div
      className={`inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/80 ${className}`}
      role="group"
      aria-label="Admin color mode"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          theme === "light"
            ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-600"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          theme === "dark"
            ? "bg-zinc-800 text-white shadow-sm ring-1 ring-emerald-500/35 dark:bg-zinc-700"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
