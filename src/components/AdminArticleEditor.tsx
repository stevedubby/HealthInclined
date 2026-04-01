"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Category } from "@/lib/categories";

const DEFAULT_BODY = `## Hook



## Simple Explanation



## Common Causes
- 



## When It's Normal vs When to Pay Attention
### Normal (usually)



### Pay attention



## What You Can Do
- 



## Quick Summary


`;

type Mode = "new" | "edit";
type BodyViewMode = "write" | "preview" | "split";

function effectiveMetaTitle(seoTitle: string, title: string): string {
  const s = seoTitle.trim();
  return s || title.trim();
}

export default function AdminArticleEditor({
  mode,
  slug: editSlug,
  categories,
}: {
  mode: Mode;
  slug?: string;
  categories: Category[];
}) {
  const defaultCat = categories[0]?.slug ?? "body-signals";

  const [slug, setSlug] = useState(editSlug ?? "");
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCat);
  const [mainKeyword, setMainKeyword] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [updatedAt, setUpdatedAt] = useState("");
  const [relatedText, setRelatedText] = useState("");
  const [videoPlatform, setVideoPlatform] = useState<"" | "youtube" | "tiktok">("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [body, setBody] = useState(mode === "new" ? DEFAULT_BODY : "");
  const [published, setPublished] = useState(mode === "new" ? false : true);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bodyView, setBodyView] = useState<BodyViewMode>("split");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const metaTitle = useMemo(() => effectiveMetaTitle(seoTitle, title), [seoTitle, title]);
  const metaTitleLen = metaTitle.length;
  const descLen = description.trim().length;
  const keywordLower = mainKeyword.trim().toLowerCase();
  const titleHasKeyword =
    keywordLower.length > 0 && title.toLowerCase().includes(keywordLower);
  const metaHasKeyword =
    keywordLower.length > 0 && metaTitle.toLowerCase().includes(keywordLower);

  useEffect(() => {
    if (categories.some((c) => c.slug === category)) return;
    setCategory(defaultCat);
  }, [categories, category, defaultCat]);

  useEffect(() => {
    if (mode !== "edit" || !editSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/posts/${encodeURIComponent(editSlug)}`);
        const data = (await res.json()) as {
          error?: string;
          frontmatter?: {
            title: string;
            description: string;
            category: string;
            mainKeyword: string;
            keywords: string[];
            publishedAt: string;
            updatedAt?: string;
            published?: boolean;
            seoTitle?: string;
            video?: { platform: string; id: string; title?: string };
            related: { slug: string; anchor: string }[];
          };
          body?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Failed to load");
          return;
        }
        if (cancelled || !data.frontmatter) return;
        const fm = data.frontmatter;
        setSlug(editSlug);
        setTitle(fm.title);
        setSeoTitle(fm.seoTitle ?? "");
        setDescription(fm.description);
        setCategory(categories.some((c) => c.slug === fm.category) ? fm.category : defaultCat);
        setMainKeyword(fm.mainKeyword);
        setKeywordsText((fm.keywords ?? []).join(", "));
        setPublishedAt(fm.publishedAt);
        setUpdatedAt(fm.updatedAt ?? "");
        setPublished(fm.published !== false);
        setRelatedText(
          (fm.related ?? []).map((r) => `${r.slug}|${r.anchor}`).join("\n"),
        );
        if (fm.video) {
          setVideoPlatform(fm.video.platform as "youtube" | "tiktok");
          setVideoId(fm.video.id);
          setVideoTitle(fm.video.title ?? "");
        }
        setBody(data.body ?? "");
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally load once per slug; category list is applied on mount from server props.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categories/defaultCat would refetch and wipe edits
  }, [mode, editSlug]);

  async function save(nextPublished: boolean | "keep") {
    setError(null);
    setSuccess(null);
    setSaving(true);
    const wasLive = published;
    try {
      const payload: Record<string, unknown> = {
        slug: mode === "new" ? slug.trim().toLowerCase() : editSlug,
        title,
        description,
        category,
        mainKeyword,
        keywordsText,
        publishedAt,
        updatedAt: updatedAt.trim() || undefined,
        body,
        relatedText,
        videoPlatform,
        videoId,
        videoTitle,
        seoTitle: seoTitle.trim(),
      };

      if (mode === "new") {
        payload.published = nextPublished === "keep" ? false : nextPublished;
      } else if (nextPublished === "keep") {
        /* omit published — server keeps visibility */
      } else {
        payload.published = nextPublished;
      }

      const url =
        mode === "new" ? "/api/admin/posts" : `/api/admin/posts/${encodeURIComponent(editSlug!)}`;
      const method = mode === "new" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        setSaving(false);
        return;
      }
      if (nextPublished !== "keep") {
        setPublished(nextPublished);
      }
      if (nextPublished === "keep") {
        setSuccess(wasLive ? "Saved — still live." : "Saved.");
      } else if (nextPublished === true) {
        setSuccess("Published — live on the site.");
      } else {
        setSuccess(wasLive ? "Unpublished — hidden from readers." : "Saved as draft — hidden from readers.");
      }
      if (mode === "new" && data.slug) {
        window.location.href = `/admin/posts/${data.slug}/edit`;
        return;
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function wrapBodySelection(prefix: string, suffix: string = prefix) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = body.slice(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const next = `${body.slice(0, start)}${replacement}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + replacement.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertBodyAtCursor(snippet: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const next = `${body.slice(0, start)}${snippet}${body.slice(start)}`;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-emerald-600/50 dark:focus:ring-emerald-500/20";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500";
  const sectionTitle = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
  const pageTitle = "mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white";
  const muted = "text-zinc-600 dark:text-zinc-400";
  const borderB = "border-zinc-200 dark:border-zinc-800";

  return (
    <div className="space-y-8">
      <div className={`flex flex-col gap-4 border-b ${borderB} pb-8 sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/90">
            {mode === "new" ? "Create" : "Edit"}
          </p>
          <h1 className={pageTitle}>{mode === "new" ? "New article" : "Edit article"}</h1>
          <p className={`mt-2 max-w-xl text-sm ${muted}`}>
            Write in Markdown, tune SEO for Google, choose a category, then publish or keep a private draft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && editSlug && published ? (
            <Link
              href={`/blog/${editSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-600 dark:text-zinc-200 dark:hover:text-emerald-300"
            >
              View live ↗
            </Link>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              published
                ? "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-300 dark:ring-emerald-500/35"
                : "bg-amber-500/10 text-amber-900 ring-1 ring-amber-500/20 dark:text-amber-200 dark:ring-amber-500/25"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100">
          {success}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="space-y-6">
          <section className={`rounded-2xl border ${borderB} bg-white/70 p-5 dark:bg-zinc-900/40 sm:p-6`}>
            <h2 className={sectionTitle}>Basics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                URL slug
                <input
                  value={slug}
                  onChange={(ev) => setSlug(ev.target.value)}
                  disabled={mode === "edit"}
                  className={`${inputClass} font-mono disabled:opacity-50`}
                  placeholder="my-article-slug"
                  required
                />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Title <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">(on-page H1)</span>
                <input
                  value={title}
                  onChange={(ev) => setTitle(ev.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Category
                <select
                  value={category}
                  onChange={(ev) => setCategory(ev.target.value)}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Published date
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(ev) => setPublishedAt(ev.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className={labelClass}>
                Updated date{" "}
                <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">(optional)</span>
                <input
                  type="date"
                  value={updatedAt}
                  onChange={(ev) => setUpdatedAt(ev.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className={`rounded-2xl border ${borderB} bg-white/70 p-5 dark:bg-zinc-900/40 sm:p-6`}>
            <h2 className={sectionTitle}>SEO &amp; keywords</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Google uses your title and description in search results. A dedicated SEO title can be shorter or more
              keyword-focused than the on-page headline.
            </p>
            <div className="mt-4 grid gap-4">
              <label className={labelClass}>
                SEO title{" "}
                <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">
                  (optional — search / social headline)
                </span>
                <input
                  value={seoTitle}
                  onChange={(ev) => setSeoTitle(ev.target.value)}
                  className={inputClass}
                  placeholder="Defaults to your article title if empty"
                />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Meta description
                <textarea
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  rows={3}
                  className={inputClass}
                  required
                />
              </label>

              <label className={labelClass}>
                Main keyword
                <input
                  value={mainKeyword}
                  onChange={(ev) => setMainKeyword(ev.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className={labelClass}>
                Extra keywords{" "}
                <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">(comma-separated)</span>
                <input
                  value={keywordsText}
                  onChange={(ev) => setKeywordsText(ev.target.value)}
                  className={inputClass}
                  placeholder="symptom, fatigue, sleep"
                />
              </label>
            </div>
          </section>

          <section className={`rounded-2xl border ${borderB} bg-white/70 p-5 dark:bg-zinc-900/40 sm:p-6`}>
            <h2 className={sectionTitle}>Video (optional)</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>
                Platform
                <select
                  value={videoPlatform}
                  onChange={(ev) => setVideoPlatform(ev.target.value as "" | "youtube" | "tiktok")}
                  className={inputClass}
                >
                  <option value="">None</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>
              <label className={labelClass}>
                Video ID
                <input
                  value={videoId}
                  onChange={(ev) => setVideoId(ev.target.value)}
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="Embed ID"
                />
              </label>
              <label className={labelClass}>
                Video title
                <input
                  value={videoTitle}
                  onChange={(ev) => setVideoTitle(ev.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className={`rounded-2xl border ${borderB} bg-white/70 p-5 dark:bg-zinc-900/40 sm:p-6`}>
            <h2 className={sectionTitle}>Related articles</h2>
            <p className="mt-1 text-xs text-zinc-500">
              One per line:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400/90">
                slug|anchor text
              </code>
            </p>
            <textarea
              value={relatedText}
              onChange={(ev) => setRelatedText(ev.target.value)}
              rows={5}
              className={`${inputClass} mt-3 font-mono text-xs`}
              placeholder={`eye-twitching|read about eyelid twitching`}
            />
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-500/20 dark:bg-zinc-900/60 sm:p-6">
            <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200/90">Article body</h2>
            <p className="mt-1 text-xs text-zinc-500">Markdown — headings, lists, links supported.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => wrapBodySelection("**")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => wrapBodySelection("*")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => wrapBodySelection("<u>", "</u>")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Underline
              </button>
              <button
                type="button"
                onClick={() => wrapBodySelection("[", "](https://)")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Link
              </button>
              <button
                type="button"
                onClick={() =>
                  insertBodyAtCursor(
                    "\n![Describe image](https://example.com/image.jpg)\n",
                  )
                }
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Image
              </button>
              <button
                type="button"
                onClick={() => insertBodyAtCursor("\n## Section heading\n")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertBodyAtCursor("\n- list item\n")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => insertBodyAtCursor("\n> quoted insight\n")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Quote
              </button>
            </div>
            <div className="mt-4 inline-flex rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
              {(["write", "preview", "split"] as BodyViewMode[]).map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => setBodyView(modeOption)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    bodyView === modeOption
                      ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {modeOption === "write"
                    ? "Write"
                    : modeOption === "preview"
                      ? "Preview"
                      : "Split"}
                </button>
              ))}
            </div>
            <div
              className={`mt-3 grid gap-3 ${
                bodyView === "split" ? "lg:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {bodyView !== "preview" ? (
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(ev) => setBody(ev.target.value)}
                  rows={22}
                  className={`${inputClass} min-h-[360px] font-mono text-xs leading-relaxed`}
                  required
                />
              ) : null}
              {bodyView !== "write" ? (
                <div className="min-h-[360px] overflow-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="prose prose-sm max-w-none prose-headings:scroll-mt-24 dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {body || "Nothing to preview yet."}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {mode === "new" ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save(false)}
                  className="rounded-2xl border border-zinc-300 bg-zinc-100 px-6 py-3.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save(true)}
                  className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400"
                >
                  {saving ? "Saving…" : "Publish"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save("keep")}
                  className="rounded-2xl border border-zinc-300 bg-zinc-100 px-6 py-3.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {!published ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void save(true)}
                    className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400"
                  >
                    {saving ? "Saving…" : "Publish"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void save(false)}
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-3.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
                  >
                    {saving ? "Saving…" : "Unpublish"}
                  </button>
                )}
              </>
            )}
            <Link
              href="/admin"
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${muted} hover:text-zinc-900 dark:hover:text-zinc-200`}
            >
              Cancel
            </Link>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className={`rounded-2xl border ${borderB} bg-white/80 p-5 dark:bg-zinc-900/60`}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500/90">
              SEO checklist
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-2">
                <span
                  className={
                    metaTitleLen > 0 && metaTitleLen <= 60 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {metaTitleLen > 0 && metaTitleLen <= 60 ? "✓" : "○"}
                </span>
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Title length</span>
                  <span className="block text-xs text-zinc-500">
                    {metaTitleLen} / ~60 chars (search display)
                  </span>
                </span>
              </li>
              <li className="flex gap-2">
                <span
                  className={
                    descLen >= 120 && descLen <= 165
                      ? "text-emerald-600 dark:text-emerald-400"
                      : descLen > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-400 dark:text-zinc-600"
                  }
                >
                  {descLen >= 120 && descLen <= 165 ? "✓" : "○"}
                </span>
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Meta description</span>
                  <span className="block text-xs text-zinc-500">
                    {descLen} chars — aim ~120–160 for snippets
                  </span>
                </span>
              </li>
              <li className="flex gap-2">
                <span
                  className={
                    titleHasKeyword ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {titleHasKeyword ? "✓" : "○"}
                </span>
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Keyword in H1 title</span>
                  <span className="block text-xs text-zinc-500">Helps relevance for your main term</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span
                  className={
                    metaHasKeyword ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-600"
                  }
                >
                  {metaHasKeyword ? "✓" : "○"}
                </span>
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Keyword in SEO title</span>
                  <span className="block text-xs text-zinc-500">Optional boost in the blue link text</span>
                </span>
              </li>
            </ul>
          </div>
          <div
            className={`rounded-2xl border border-dashed ${borderB} bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500 dark:bg-zinc-950/50`}
          >
            Drafts never appear on the blog or in the sitemap. Publish when the piece is ready for readers and Google.
          </div>
        </aside>
      </div>
    </div>
  );
}
