"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Hit = { slug: string; title: string; description: string; categories: string[] };

export default function HomeSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (query: string) => {
    const t = query.trim();
    if (!t) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`);
      const data = (await res.json()) as { results?: Hit[] };
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = q.trim();
    if (!t) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      void runSearch(t);
    }, 280);
    return () => clearTimeout(id);
  }, [q, runSearch]);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-zinc-900 sm:p-5">
      <label htmlFor="home-search" className="block text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Search articles
      </label>
      <input
        id="home-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles and article text…"
        className="mt-2 w-full rounded-xl border border-emerald-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none ring-emerald-500/0 transition placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-emerald-700"
        autoComplete="off"
      />
      {q.trim() ? (
        <div className="mt-4 border-t border-emerald-100 pt-4 dark:border-emerald-900">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No articles match that search.</p>
          ) : (
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-xl border border-transparent px-2 py-2 transition hover:border-emerald-100 hover:bg-emerald-50/50 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                  >
                    <span className="text-xs font-semibold text-emerald-700">
                      {r.categories?.length
                        ? r.categories.map((s) => s.replace(/-/g, " ")).join(" · ")
                        : ""}
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.title}</span>
                    <span className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{r.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
