"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type RelatedLinkRow = { slug: string; anchor: string };

export type ArticlePickOption = { slug: string; title: string };

type Props = {
  allArticles: ArticlePickOption[];
  /** Hide this slug from suggestions (the article you are editing). */
  excludeSlug: string;
  value: RelatedLinkRow[];
  onChange: (rows: RelatedLinkRow[]) => void;
};

export default function AdminRelatedArticlesPicker({
  allArticles,
  excludeSlug,
  value,
  onChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const excludeNorm = excludeSlug.trim().toLowerCase();
  const selectedSlugs = new Set(value.map((r) => r.slug));

  const titleBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of allArticles) {
      m.set(a.slug, a.title);
    }
    return m;
  }, [allArticles]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allArticles.filter((a) => {
      if (a.slug === excludeNorm) return false;
      if (selectedSlugs.has(a.slug)) return false;
      if (!q) return true;
      return (
        a.slug.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q)
      );
    });
    list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    return list.slice(0, 12);
  }, [allArticles, excludeNorm, query, selectedSlugs]);

  function addArticle(slug: string, title: string) {
    if (selectedSlugs.has(slug) || slug === excludeNorm) return;
    onChange([...value, { slug, anchor: title }]);
    setQuery("");
    setOpen(false);
  }

  function updateAnchor(index: number, anchor: string) {
    const next = value.map((row, i) => (i === index ? { ...row, anchor } : row));
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div ref={rootRef} className="mt-3 space-y-4">
      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Add related article
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by title or slug…"
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          autoComplete="off"
        />
        {open && suggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            role="listbox"
          >
            {suggestions.map((a) => (
              <li key={a.slug}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addArticle(a.slug, a.title)}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.title}</span>
                  <span className="font-mono text-xs text-zinc-500">{a.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && suggestions.length === 0 ? (
          <p className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            {query.trim()
              ? "No matching articles. Try another search."
              : "No more articles to add, or your library is empty."}
          </p>
        ) : null}
      </div>

      {value.length > 0 ? (
        <ul className="space-y-3">
          {value.map((row, index) => {
            const knownTitle = titleBySlug.get(row.slug);
            return (
              <li
                key={`${row.slug}-${index}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {knownTitle ?? row.slug}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-zinc-500">{row.slug}</div>
                    {!knownTitle ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">
                        This slug is not in your library (moved or deleted). You can remove it or keep the link text for when you restore the post.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Remove
                  </button>
                </div>
                <label className="mt-2 block text-xs font-semibold text-zinc-500 dark:text-zinc-500">
                  Link label (shown to readers)
                  <input
                    value={row.anchor}
                    onChange={(e) => updateAnchor(index, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No related articles yet. Search above to add some.</p>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Up to four are highlighted on the public article page; you can add more for future use.
      </p>
    </div>
  );
}
