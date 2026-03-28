"use client";

import { useState } from "react";
import Link from "next/link";
import AdminThemeToggle from "@/components/AdminThemeToggle";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-16 dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <AdminThemeToggle />
      </div>

      <div className="mb-10 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-500/90">
          Healthinclined
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">Content studio</p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white/90 p-8 shadow-xl shadow-zinc-200/50 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-black/40">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Sign in</h1>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-600/50 dark:focus:ring-emerald-500/20"
              required
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          <Link
            href="/"
            className="font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
