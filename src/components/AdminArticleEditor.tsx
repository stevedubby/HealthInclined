"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/categories";
import AdminRelatedArticlesPicker, {
  type ArticlePickOption,
  type RelatedLinkRow,
} from "@/components/AdminRelatedArticlesPicker";
import TiptapArticleBodyEditor from "@/components/TiptapArticleBodyEditor";
import {
  draftPlainTextMeetsAutosaveThreshold,
  EMPTY_TIPTAP_DOC_JSON,
  isTiptapJsonContent,
  isValidArticleBody,
  markdownToTiptapJson,
} from "@/lib/tiptap-article";
import { SITE } from "@/lib/site";
import { parseTikTokVideoId } from "@/lib/tiktok-id";
import { parseYoutubeVideoId } from "@/lib/youtube-id";

function effectiveMetaTitle(seoTitle: string, title: string): string {
  const s = seoTitle.trim();
  return s || title.trim();
}

function sortedCategoryKey(slugs: string[]) {
  return JSON.stringify([...slugs].slice().sort());
}

/** Compare localStorage vs server timestamps (date-only YYYY-MM-DD → end of UTC day). */
function editorSavedAtMs(iso: string | null | undefined): number {
  const t = String(iso ?? "").trim();
  if (!t) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return Date.parse(`${t}T23:59:59.999Z`) || 0;
  }
  return Date.parse(t) || 0;
}

const AUTOSAVE_LS_PREFIX = "healthinclined-editor-autosave:v1";

function autosaveStorageKey(slug: string | null) {
  return slug ? `${AUTOSAVE_LS_PREFIX}:${slug}` : `${AUTOSAVE_LS_PREFIX}:new`;
}

/** New-article backup: tab session only so "Create article" is a clean slate in a new tab. */
function offlineDraftStore(mode: Mode): Storage {
  return mode === "new" ? sessionStorage : localStorage;
}

function offlineDraftStorageKey(
  mode: Mode,
  editSlug: string | undefined,
  remoteDraftSlug: string | null,
): string {
  const slugKey = mode === "edit" && editSlug ? editSlug : remoteDraftSlug;
  return autosaveStorageKey(slugKey ?? null);
}

const LEGACY_DRAFT_DESCRIPTION =
  "Draft — add a meta description before publishing.";

function normalizeLoadedSeoFields(fm: {
  description: string;
  mainKeyword: string;
  keywords: string[];
}): { description: string; mainKeyword: string; keywordsText: string } {
  const placeholderSeo =
    fm.mainKeyword.trim().toLowerCase() === "draft" &&
    (fm.keywords ?? []).length === 1 &&
    (fm.keywords ?? [])[0] === "draft";
  return {
    description:
      fm.description.trim() === LEGACY_DRAFT_DESCRIPTION.trim() ? "" : fm.description,
    mainKeyword: placeholderSeo ? "" : fm.mainKeyword,
    keywordsText: placeholderSeo ? "" : (fm.keywords ?? []).join(", "),
  };
}

type Mode = "new" | "edit";

export default function AdminArticleEditor({
  mode,
  slug: editSlug,
  categories,
  allArticles,
}: {
  mode: Mode;
  slug?: string;
  categories: Category[];
  allArticles: ArticlePickOption[];
}) {
  const router = useRouter();
  const defaultCat = categories[0]?.slug ?? "body-signals";

  const [slug, setSlug] = useState(editSlug ?? "");
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([defaultCat]);
  const [mainKeyword, setMainKeyword] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [updatedAt, setUpdatedAt] = useState("");
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinkRow[]>([]);
  const [videoPlatform, setVideoPlatform] = useState<"" | "youtube" | "tiktok">("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [body, setBody] = useState(EMPTY_TIPTAP_DOC_JSON);
  const [editorMountKey, setEditorMountKey] = useState(0);
  const [published, setPublished] = useState(mode === "new" ? false : true);
  const [featured, setFeatured] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error" | "local">(
    "idle",
  );
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const [lastServerSavedAt, setLastServerSavedAt] = useState<string | null>(null);
  const [remoteDraftSlug, setRemoteDraftSlug] = useState<string | null>(() =>
    mode === "edit" && editSlug ? editSlug : null,
  );
  const [autosaveUnlocked, setAutosaveUnlocked] = useState(false);
  /** Set when draft API returns 503 so we show an accurate message (not “no DB” for browser-cache cases). */
  const [draftSyncBlockedCode, setDraftSyncBlockedCode] = useState<string | null>(null);
  const shouldFlushAfterBrowserMergeRef = useRef(false);

  const snapRef = useRef({
    title: "",
    body: "",
    categorySlugs: [defaultCat] as string[],
    thumbnailUrl: "",
  });
  const lastAutosaveSentRef = useRef({
    title: "",
    body: "",
    categoryKey: "",
    thumbnailUrl: "",
    slug: "",
  });
  const ctxRef = useRef({
    mode,
    editSlug: editSlug ?? null,
    remoteDraftSlug: null as string | null,
    published: mode === "new" ? false : true,
  });
  const slugRef = useRef(slug);
  const inFlightRef = useRef(false);
  const hydratedNewRef = useRef(false);
  const flushAutosaveRef = useRef<() => Promise<void>>(async () => {});
  const autosaveUnlockedRef = useRef(false);

  slugRef.current = slug;
  snapRef.current = { title, body, categorySlugs: selectedCategories, thumbnailUrl };
  ctxRef.current = { mode, editSlug: editSlug ?? null, remoteDraftSlug, published };
  autosaveUnlockedRef.current = autosaveUnlocked;

  const metaTitle = useMemo(() => effectiveMetaTitle(seoTitle, title), [seoTitle, title]);
  const metaTitleLen = metaTitle.length;
  const descLen = description.trim().length;
  const keywordLower = mainKeyword.trim().toLowerCase();
  const titleHasKeyword =
    keywordLower.length > 0 && title.toLowerCase().includes(keywordLower);
  const metaHasKeyword =
    keywordLower.length > 0 && metaTitle.toLowerCase().includes(keywordLower);

  useEffect(() => {
    if (draftPlainTextMeetsAutosaveThreshold(body)) {
      setAutosaveUnlocked(true);
    }
  }, [body]);

  const autosaveLine = useMemo(() => {
    if (published) return "";
    if (!autosaveUnlocked) {
      return "Start writing to enable autosave (about 25 characters in the article body).";
    }
    if (autosaveState === "saving") return "Saving…";
    if (autosaveState === "local") {
      const hint =
        draftSyncBlockedCode === "NO_DATABASE"
          ? "Add DATABASE_URL, POSTGRES_URL, or SUPABASE_DATABASE_URL to the server environment, then redeploy."
          : draftSyncBlockedCode === "NO_PERSISTENT_STORE"
            ? "Hosted runtime needs a database connection string or CONTENT_DATA_DIR for writes."
            : "Server could not save this draft.";
      return lastAutosaveAt
        ? `Saved in this browser · ${new Date(lastAutosaveAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — ${hint}`
        : `Saved in this browser only — ${hint}`;
    }
    if (autosaveState === "error") {
      return "Autosave failed — your work stays in this browser until you use Save or Publish.";
    }
    if (autosaveState === "saved" && lastAutosaveAt) {
      return `Saved · ${new Date(lastAutosaveAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
    }
    if (lastAutosaveAt) {
      return `Last saved · ${new Date(lastAutosaveAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
    }
    return "Autosave runs about every 15 seconds and ~3s after you pause typing.";
  }, [published, autosaveUnlocked, autosaveState, lastAutosaveAt, draftSyncBlockedCode]);

  useEffect(() => {
    setSelectedCategories((prev) => {
      const next = prev.filter((s) => categories.some((c) => c.slug === s));
      if (next.length === prev.length && next.length > 0) return prev;
      return next.length ? next : [defaultCat];
    });
  }, [categories, defaultCat]);

  useEffect(() => {
    if (mode !== "new" || loading || hydratedNewRef.current) return;
    try {
      try {
        localStorage.removeItem(autosaveStorageKey(null));
      } catch {
        /* ignore */
      }
      const raw = offlineDraftStore("new").getItem(autosaveStorageKey(null));
      if (raw) {
        const d = JSON.parse(raw) as {
          body?: string;
          title?: string;
          category?: string;
          categories?: string[];
          thumbnailUrl?: string;
        };
        if (d.title) setTitle(d.title);
        if (Array.isArray(d.categories) && d.categories.length) {
          const v = d.categories.filter((s) => categories.some((c) => c.slug === s));
          if (v.length) setSelectedCategories(v);
        } else if (d.category && categories.some((c) => c.slug === d.category)) {
          setSelectedCategories([d.category]);
        }
        if (d.thumbnailUrl !== undefined) setThumbnailUrl(d.thumbnailUrl);
        if (d.body && isTiptapJsonContent(d.body)) {
          setBody(d.body);
          setEditorMountKey((k) => k + 1);
        }
      }
    } catch {
      /* ignore */
    }
    hydratedNewRef.current = true;
  }, [mode, loading, categories]);

  useEffect(() => {
    flushAutosaveRef.current = async () => {
      if (inFlightRef.current) return;
      const ctx = ctxRef.current;
      if (ctx.published) return;
      const snap = snapRef.current;
      if (
        !autosaveUnlockedRef.current &&
        !draftPlainTextMeetsAutosaveThreshold(snap.body)
      ) {
        return;
      }
      const wasNew = ctx.mode === "new";
      const sent = lastAutosaveSentRef.current;
      const catKey = sortedCategoryKey(snap.categorySlugs);
      const slugNow = slugRef.current.trim().toLowerCase();
      const slugForPut = ctx.mode === "edit" ? ctx.editSlug : ctx.remoteDraftSlug;

      const payload: Record<string, unknown> = {};
      const trimmedTitle = snap.title.trim();
      if (trimmedTitle && trimmedTitle !== sent.title) payload.title = trimmedTitle;
      if (snap.body !== sent.body) payload.body = snap.body;
      if (catKey !== sent.categoryKey) payload.categories = snap.categorySlugs;
      if (snap.thumbnailUrl.trim() !== sent.thumbnailUrl) {
        payload.thumbnailUrl = snap.thumbnailUrl.trim();
      }
      if (
        slugForPut &&
        slugNow &&
        slugNow !== slugForPut &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugNow) &&
        slugNow.length <= 120
      ) {
        payload.slug = slugNow;
      } else if (!slugForPut && slugNow && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugNow) && slugNow.length <= 120) {
        payload.slug = slugNow;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      inFlightRef.current = true;
      startTransition(() => setAutosaveState("saving"));
      try {
        let res: Response;
        if (slugForPut) {
          res = await fetch(`/api/articles/${encodeURIComponent(slugForPut)}/draft`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include",
          });
        } else {
          const postBody = { ...payload, categories: snap.categorySlugs };
          res = await fetch("/api/articles/draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postBody),
            credentials: "include",
          });
        }
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          slug?: string;
          lastSavedAt?: string;
          error?: string;
          code?: string;
        };
        if (!res.ok) {
          if (res.status === 503) {
            const code = typeof data.code === "string" ? data.code : null;
            setDraftSyncBlockedCode(code ?? "UNAVAILABLE");
            startTransition(() => setAutosaveState("local"));
            setLastAutosaveAt(new Date().toISOString());
          } else {
            startTransition(() => setAutosaveState("error"));
          }
          return;
        }
        setDraftSyncBlockedCode(null);
        if (data.lastSavedAt) {
          setLastAutosaveAt(data.lastSavedAt);
          setLastServerSavedAt(data.lastSavedAt);
        }
        if (data.slug) {
          setRemoteDraftSlug(data.slug);
          if (wasNew) {
            router.replace(`/admin/posts/${encodeURIComponent(data.slug)}/edit`);
          }
        }
        const u = { ...sent };
        if ("title" in payload) u.title = trimmedTitle;
        if ("body" in payload) u.body = snap.body;
        if ("categories" in payload) u.categoryKey = catKey;
        if ("thumbnailUrl" in payload) u.thumbnailUrl = snap.thumbnailUrl.trim();
        if (data.slug) u.slug = data.slug;
        lastAutosaveSentRef.current = u;
        startTransition(() => setAutosaveState("saved"));
      } catch {
        startTransition(() => setAutosaveState("error"));
      } finally {
        inFlightRef.current = false;
      }
    };
  }, [router]);

  useEffect(() => {
    if (mode !== "edit" || !editSlug || loading || published || !lastServerSavedAt) return;
    try {
      const raw = localStorage.getItem(autosaveStorageKey(editSlug));
      if (!raw) return;
      const d = JSON.parse(raw) as {
        savedAt?: string;
        title?: string;
        body?: string;
        category?: string;
        categories?: string[];
        thumbnailUrl?: string;
      };
      if (!d.savedAt || editorSavedAtMs(d.savedAt) <= editorSavedAtMs(lastServerSavedAt)) return;
      if (d.title) setTitle(d.title);
      if (Array.isArray(d.categories) && d.categories.length) {
        const v = d.categories.filter((s) => categories.some((c) => c.slug === s));
        if (v.length) setSelectedCategories(v);
      } else if (d.category && categories.some((c) => c.slug === d.category)) {
        setSelectedCategories([d.category]);
      }
      if (d.thumbnailUrl !== undefined) setThumbnailUrl(d.thumbnailUrl);
      if (d.body && isTiptapJsonContent(d.body)) {
        setBody(d.body);
        setEditorMountKey((k) => k + 1);
      }
      shouldFlushAfterBrowserMergeRef.current = true;
    } catch {
      /* ignore */
    }
  }, [mode, editSlug, loading, published, lastServerSavedAt, categories]);

  useEffect(() => {
    if (!shouldFlushAfterBrowserMergeRef.current) return;
    if (published) {
      shouldFlushAfterBrowserMergeRef.current = false;
      return;
    }
    const canFlush =
      autosaveUnlocked || draftPlainTextMeetsAutosaveThreshold(body);
    if (!canFlush) return;
    shouldFlushAfterBrowserMergeRef.current = false;
    void flushAutosaveRef.current();
  }, [title, body, selectedCategories, thumbnailUrl, slug, published, autosaveUnlocked]);

  useEffect(() => {
    if (published) return;
    const store = offlineDraftStore(mode);
    const key = offlineDraftStorageKey(mode, editSlug, remoteDraftSlug);
    const id = window.setTimeout(() => {
      try {
        store.setItem(
          key,
          JSON.stringify({
            v: 1,
            savedAt: new Date().toISOString(),
            title,
            body,
            categories: selectedCategories,
            thumbnailUrl,
          }),
        );
      } catch {
        /* quota */
      }
    }, 700);
    return () => clearTimeout(id);
  }, [title, body, selectedCategories, thumbnailUrl, published, mode, editSlug, remoteDraftSlug]);

  useEffect(() => {
    if (published) return;
    const id = window.setTimeout(() => {
      void flushAutosaveRef.current();
    }, 2800);
    return () => clearTimeout(id);
  }, [title, body, selectedCategories, thumbnailUrl, slug, published, autosaveUnlocked]);

  useEffect(() => {
    if (published) return;
    const id = window.setInterval(() => {
      void flushAutosaveRef.current();
    }, 15000);
    return () => clearInterval(id);
  }, [published, autosaveUnlocked]);

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
            categories?: string[];
            mainKeyword: string;
            keywords: string[];
            publishedAt: string;
            updatedAt?: string;
            published?: boolean;
            seoTitle?: string;
            video?: { platform: string; id: string; title?: string };
            related: { slug: string; anchor: string }[];
            featured?: boolean;
            createdAt?: string;
            thumbnailUrl?: string;
            lastSavedAt?: string;
          };
          body?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Failed to load");
          return;
        }
        if (cancelled || !data.frontmatter) return;
        const fm = data.frontmatter;
        const serverSyncWatermark =
          fm.lastSavedAt?.trim() ||
          (fm.updatedAt?.trim().includes("T") ? fm.updatedAt.trim() : "") ||
          fm.createdAt?.trim() ||
          null;
        setLastServerSavedAt(serverSyncWatermark);
        setLastAutosaveAt(fm.lastSavedAt?.trim() || null);
        setRemoteDraftSlug(editSlug);
        setSlug(editSlug);
        setTitle(fm.title);
        setSeoTitle(fm.seoTitle ?? "");
        const seo = normalizeLoadedSeoFields({
          description: fm.description,
          mainKeyword: fm.mainKeyword,
          keywords: fm.keywords ?? [],
        });
        setDescription(seo.description);
        const initialCats = (() => {
          if (Array.isArray(fm.categories) && fm.categories.length) {
            const v = fm.categories.filter((s) => categories.some((c) => c.slug === s));
            return v.length ? v : [defaultCat];
          }
          if (fm.category && categories.some((c) => c.slug === fm.category)) return [fm.category];
          return [defaultCat];
        })();
        setSelectedCategories(initialCats);
        setMainKeyword(seo.mainKeyword);
        setKeywordsText(seo.keywordsText);
        setPublishedAt(fm.publishedAt);
        setUpdatedAt(fm.updatedAt ?? "");
        setPublished(fm.published !== false);
        setRelatedLinks(
          (fm.related ?? []).map((r) => ({ slug: r.slug, anchor: r.anchor })),
        );
        if (fm.video) {
          setVideoPlatform(fm.video.platform as "youtube" | "tiktok");
          const vid = fm.video.id;
          const platform = fm.video.platform;
          if (platform === "youtube") {
            setVideoId(parseYoutubeVideoId(vid) ?? vid);
          } else if (platform === "tiktok") {
            setVideoId(parseTikTokVideoId(vid) ?? vid);
          } else {
            setVideoId(vid);
          }
          setVideoTitle(fm.video.title ?? "");
        }

        setFeatured(fm.featured === true);
        setThumbnailUrl(fm.thumbnailUrl ?? "");
        setCreatedAt(fm.createdAt?.trim() ?? "");

        const raw = data.body ?? "";
        let loadedBody = EMPTY_TIPTAP_DOC_JSON;
        if (isTiptapJsonContent(raw)) {
          loadedBody = raw;
        } else if (raw.trim()) {
          try {
            loadedBody = markdownToTiptapJson(raw);
          } catch {
            loadedBody = EMPTY_TIPTAP_DOC_JSON;
          }
        }
        setBody(loadedBody);
        setEditorMountKey((k) => k + 1);
        lastAutosaveSentRef.current = {
          title: fm.title,
          body: loadedBody,
          categoryKey: sortedCategoryKey(initialCats),
          thumbnailUrl: (fm.thumbnailUrl ?? "").trim(),
          slug: editSlug,
        };
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per slug
  }, [mode, editSlug]);

  async function save(nextPublished: boolean | "keep") {
    setError(null);
    setSuccess(null);
    if (!isValidArticleBody(body)) {
      setError("Add some content to the article body before saving.");
      return;
    }
    if (!selectedCategories.length) {
      setError("Select at least one category.");
      return;
    }

    const vidTrim = videoId.trim();
    let videoIdOut = vidTrim;
    if (videoPlatform === "youtube" && vidTrim) {
      const parsed = parseYoutubeVideoId(vidTrim);
      if (!parsed) {
        setError(
          "Could not read that YouTube link. Paste a Shorts URL (youtube.com/shorts/…), a watch link, youtu.be/…, or the 11-character video ID.",
        );
        return;
      }
      videoIdOut = parsed;
    } else if (videoPlatform === "tiktok" && vidTrim) {
      const parsed = parseTikTokVideoId(vidTrim);
      if (!parsed) {
        setError(
          "Could not read that TikTok link. Paste the full video URL from tiktok.com (with /video/…) or the numeric video ID. Short vm.tiktok.com links: open in a browser, then copy the full URL from the address bar.",
        );
        return;
      }
      videoIdOut = parsed;
    }

    setSaving(true);
    const wasLive = published;
    try {
      const payload: Record<string, unknown> = {
        slug: slug.trim().toLowerCase(),
        title,
        description,
        categories: selectedCategories,
        mainKeyword,
        keywordsText,
        publishedAt,
        updatedAt: updatedAt.trim() || undefined,
        body,
        relatedText: relatedLinks.map((r) => `${r.slug}|${r.anchor}`).join("\n"),
        videoPlatform,
        videoId: videoIdOut,
        videoTitle,
        seoTitle: seoTitle.trim(),
        featured,
        thumbnailUrl: thumbnailUrl.trim(),
      };

      if (mode === "edit" && createdAt.trim()) {
        payload.createdAt = createdAt.trim();
      }

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
      if (mode === "edit" && data.slug && editSlug && data.slug !== editSlug) {
        setSlug(data.slug);
        setSuccess("Saved — article URL was updated.");
        router.replace(`/admin/posts/${encodeURIComponent(data.slug)}/edit`);
        setSaving(false);
        setLastAutosaveAt(new Date().toISOString());
        return;
      }
      setLastAutosaveAt(new Date().toISOString());
      if ((videoPlatform === "youtube" || videoPlatform === "tiktok") && videoIdOut) {
        setVideoId(videoIdOut);
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

  function resetNewArticleDraft() {
    if (mode !== "new") return;
    try {
      sessionStorage.removeItem(autosaveStorageKey(null));
    } catch {
      /* ignore */
    }
    setTitle("");
    setSlug("");
    setDescription("");
    setSeoTitle("");
    setMainKeyword("");
    setKeywordsText("");
    setThumbnailUrl("");
    setBody(EMPTY_TIPTAP_DOC_JSON);
    setEditorMountKey((k) => k + 1);
    setSelectedCategories([defaultCat]);
    setRelatedLinks([]);
    setVideoPlatform("");
    setVideoId("");
    setVideoTitle("");
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setAutosaveUnlocked(false);
    setRemoteDraftSlug(null);
    setLastAutosaveAt(null);
    setAutosaveState("idle");
    setDraftSyncBlockedCode(null);
    lastAutosaveSentRef.current = {
      title: "",
      body: "",
      categoryKey: sortedCategoryKey([defaultCat]),
      thumbnailUrl: "",
      slug: "",
    };
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
            Write visually (like Medium or Notion), tune SEO, pick categories, then publish or keep a private draft.
          </p>
          {mode === "new" ? (
            <button
              type="button"
              onClick={resetNewArticleDraft}
              className="mt-2 text-left text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Start blank — clear in-progress work in this tab
            </button>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {mode === "edit" && (slug.trim().toLowerCase() || editSlug) && published ? (
              <Link
                href={`/blog/${slug.trim().toLowerCase() || editSlug}`}
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
          {!published ? (
            <p className="max-w-sm text-right text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {autosaveLine}
            </p>
          ) : null}
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
                Title <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">(on-page H1)</span>
                <input
                  value={title}
                  onChange={(ev) => setTitle(ev.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                URL slug
                <input
                  value={slug}
                  onChange={(ev) => setSlug(ev.target.value)}
                  className={`${inputClass} font-mono`}
                  placeholder="my-article-slug"
                  required
                />
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  You can edit this anytime. Old public links keep working via redirects.
                </p>
                <p className="mt-1 font-mono text-xs text-emerald-800 dark:text-emerald-400">
                  {SITE.baseUrl}/blog/{slug.trim().toLowerCase() || "your-slug"}
                </p>
              </label>

              <div className={`${labelClass} sm:col-span-2`}>
                Categories
                <p className="mt-1 text-xs font-normal normal-case text-zinc-500 dark:text-zinc-500">
                  Select one or more. The article appears on each category&apos;s public page.
                </p>
                <div className="mt-2 flex flex-col gap-2 rounded-xl border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
                  {categories.map((c) => (
                    <label
                      key={c.slug}
                      className="flex cursor-pointer items-center gap-3 text-sm font-normal normal-case text-zinc-800 dark:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(c.slug)}
                        onChange={() => {
                          setSelectedCategories((prev) => {
                            if (prev.includes(c.slug)) {
                              const next = prev.filter((s) => s !== c.slug);
                              return next.length ? next : prev;
                            }
                            return [...prev, c.slug].sort();
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className={`${labelClass} flex items-center gap-3 sm:col-span-2`}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(ev) => setFeatured(ev.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                />
                <span>
                  Mark as featured{" "}
                  <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">
                    (homepage spotlight — only one article should be featured at a time)
                  </span>
                </span>
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Thumbnail image URL{" "}
                <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">
                  (optional — used on article cards; leave empty to use the first image in the body)
                </span>
                <input
                  value={thumbnailUrl}
                  onChange={(ev) => setThumbnailUrl(ev.target.value)}
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="https://…"
                />
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
            <p className="mt-1 text-xs text-zinc-500">
              <strong className="font-medium text-zinc-600 dark:text-zinc-400">YouTube:</strong> paste a Shorts link,
              watch URL, or ID — we normalize it.{" "}
              <strong className="font-medium text-zinc-600 dark:text-zinc-400">TikTok:</strong> paste the full{" "}
              <code className="rounded bg-zinc-100 px-1 text-[11px] dark:bg-zinc-800">tiktok.com/.../video/…</code> URL or
              the numeric ID. Short <code className="rounded bg-zinc-100 px-1 text-[11px] dark:bg-zinc-800">vm.tiktok.com</code>{" "}
              links: open in a browser first, then copy the URL from the address bar.
            </p>
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
                Video ID or full URL{" "}
                <span className="font-normal normal-case text-zinc-400 dark:text-zinc-600">(YouTube / TikTok)</span>
                <input
                  value={videoId}
                  onChange={(ev) => setVideoId(ev.target.value)}
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="YouTube Shorts URL or TikTok …/video/… link / numeric ID"
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
              Search your library and pick articles. You can edit the link label readers see.
            </p>
            <AdminRelatedArticlesPicker
              allArticles={allArticles}
              excludeSlug={slug.trim().toLowerCase() || editSlug || ""}
              value={relatedLinks}
              onChange={setRelatedLinks}
            />
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-500/20 dark:bg-zinc-900/60 sm:p-6">
            <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200/90">Article body</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Visual editor — type, paste links, and add images. No markdown syntax.
            </p>
            <div className="mt-4">
              <TiptapArticleBodyEditor
                key={editorMountKey}
                initialDocJson={body}
                onChange={setBody}
              />
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
