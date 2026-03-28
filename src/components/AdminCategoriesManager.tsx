"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/categories";

type Props = {
  initialCategories: Category[];
  postCounts: Record<string, { total: number; live: number }>;
};

export default function AdminCategoriesManager({ initialCategories, postCounts }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newHighlight, setNewHighlight] = useState(false);

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editHighlight, setEditHighlight] = useState(false);

  function startEdit(c: Category) {
    setEditingSlug(c.slug);
    setEditName(c.name);
    setEditDesc(c.shortDescription);
    setEditHighlight(c.highlight === true);
    setError(null);
  }

  function cancelEdit() {
    setEditingSlug(null);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("create");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug.trim().toLowerCase(),
          name: newName.trim(),
          shortDescription: newDesc.trim(),
          highlight: newHighlight,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        setBusy(null);
        return;
      }
      setNewSlug("");
      setNewName("");
      setNewDesc("");
      setNewHighlight(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(slug: string) {
    setError(null);
    setBusy(`edit-${slug}`);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          shortDescription: editDesc.trim(),
          highlight: editHighlight,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        setBusy(null);
        return;
      }
      setEditingSlug(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function removeCategory(slug: string) {
    if (!window.confirm(`Delete category “${slug}”? This cannot be undone.`)) return;
    setError(null);
    setBusy(`del-${slug}`);
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  const card =
    "rounded-2xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/50";
  const label =
    "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500";
  const input =
    "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/0 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100";

  return (
    <div className="space-y-10">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className={card}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add category</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Slug becomes the URL segment{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] dark:bg-zinc-800">/category/your-slug</code>.
          Use lowercase letters, numbers, and hyphens only.
        </p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={createCategory}>
          <label className={label}>
            Slug
            <input
              className={`${input} font-mono text-xs`}
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="e.g. nutrition"
              required
            />
          </label>
          <label className={label}>
            Display name
            <input className={input} value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Short description
            <textarea
              className={`${input} min-h-[72px]`}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              required
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={newHighlight}
              onChange={(e) => setNewHighlight(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Highlight on homepage (optional)</span>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy === "create"}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              {busy === "create" ? "Creating…" : "Create category"}
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {initialCategories.map((c) => {
          const counts = postCounts[c.slug] ?? { total: 0, live: 0 };
          const editing = editingSlug === c.slug;

          return (
            <div
              key={c.slug}
              className="rounded-2xl border border-zinc-200 bg-white/70 p-5 transition hover:border-emerald-300/60 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-500/30"
            >
              {editing ? (
                <div className="space-y-3">
                  <div className="font-mono text-xs text-zinc-500">{c.slug}</div>
                  <label className={label}>
                    Name
                    <input className={input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </label>
                  <label className={label}>
                    Description
                    <textarea
                      className={`${input} min-h-[64px]`}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editHighlight}
                      onChange={(e) => setEditHighlight(e.target.checked)}
                      className="rounded border-zinc-300 text-emerald-600 dark:border-zinc-600"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Highlight</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === `edit-${c.slug}`}
                      onClick={() => void saveEdit(c.slug)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-500">
                        {c.shortDescription}
                      </p>
                      {c.highlight ? (
                        <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                          Highlighted
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {counts.total}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Link
                      href={`/category/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Public page ↗
                    </Link>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="text-zinc-500">{counts.live} published</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy === `del-${c.slug}` || initialCategories.length <= 1}
                      onClick={() => void removeCategory(c.slug)}
                      className="text-xs font-semibold text-red-600 hover:text-red-500 disabled:opacity-40 dark:text-red-400"
                    >
                      {busy === `del-${c.slug}` ? "…" : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
