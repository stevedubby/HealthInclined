"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const VIEW_COOLDOWN_MS = 30 * 60 * 1000;

function viewTsKey(slug: string) {
  return `hi_article_view_ts_${slug}`;
}
function viewSessionKey(slug: string) {
  return `hi_article_view_sent_${slug}`;
}
function likeKey(slug: string) {
  return `hi_article_like_${slug}`;
}

type EngagementContextValue = {
  slug: string;
  articleUrl: string;
  title: string;
  views: number;
  likes: number;
  liked: boolean;
  toggleLike: () => void;
  likeBusy: boolean;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  copied: boolean;
  copyLink: () => void;
  openShare: (target: "whatsapp" | "twitter" | "facebook") => void;
};

const EngagementContext = createContext<EngagementContextValue | null>(null);

function useEngagement() {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error("useEngagement within provider");
  return ctx;
}

export function ArticleEngagementProvider({
  slug,
  initialViews,
  initialLikes,
  articleUrl,
  title,
  children,
}: {
  slug: string;
  initialViews: number;
  initialLikes: number;
  articleUrl: string;
  title: string;
  children: ReactNode;
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiked(typeof window !== "undefined" && localStorage.getItem(likeKey(slug)) === "1");
  }, [slug]);

  useEffect(() => {
    setViews(initialViews);
    setLikes(initialLikes);
  }, [slug, initialViews, initialLikes]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem(viewSessionKey(slug)) === "1") return;

    const last = parseInt(localStorage.getItem(viewTsKey(slug)) || "0", 10);
    if (last > 0 && Date.now() - last < VIEW_COOLDOWN_MS) {
      sessionStorage.setItem(viewSessionKey(slug), "1");
      return;
    }

    sessionStorage.setItem(viewSessionKey(slug), "1");
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/view`, {
          method: "POST",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { views?: number };
          if (typeof data.views === "number") setViews(data.views);
          localStorage.setItem(viewTsKey(slug), String(Date.now()));
        } else {
          sessionStorage.removeItem(viewSessionKey(slug));
        }
      } catch {
        if (!cancelled) sessionStorage.removeItem(viewSessionKey(slug));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!shareOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [shareOpen]);

  const toggleLike = useCallback(async () => {
    if (likeBusy) return;
    const next = !liked;
    const delta = next ? 1 : -1;
    setLiked(next);
    setLikes((n) => Math.max(0, n + delta));
    setLikeBusy(true);

    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ like: next }),
      });
      const data = (await res.json()) as { likes?: number };
      if (!res.ok) throw new Error("like failed");
      if (typeof data.likes === "number") setLikes(data.likes);
      if (next) localStorage.setItem(likeKey(slug), "1");
      else localStorage.removeItem(likeKey(slug));
    } catch {
      setLiked(!next);
      setLikes((n) => Math.max(0, n - delta));
    } finally {
      setLikeBusy(false);
    }
  }, [likeBusy, liked, slug]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setShareOpen(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [articleUrl]);

  const openShare = useCallback(
    (target: "whatsapp" | "twitter" | "facebook") => {
      const text = `${title} — ${articleUrl}`;
      const encUrl = encodeURIComponent(articleUrl);
      const encText = encodeURIComponent(title);
      let url = "";
      if (target === "whatsapp") {
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      } else if (target === "twitter") {
        url = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`;
      } else {
        url = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setShareOpen(false);
    },
    [articleUrl, title],
  );

  const value = useMemo<EngagementContextValue>(
    () => ({
      slug,
      articleUrl,
      title,
      views,
      likes,
      liked,
      toggleLike,
      likeBusy,
      shareOpen,
      setShareOpen,
      copied,
      copyLink,
      openShare,
    }),
    [
      slug,
      articleUrl,
      title,
      views,
      likes,
      liked,
      toggleLike,
      likeBusy,
      shareOpen,
      copied,
      copyLink,
      openShare,
    ],
  );

  return (
    <EngagementContext.Provider value={value}>
      <div ref={shareRef}>{children}</div>
    </EngagementContext.Provider>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconThumb({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={`${className ?? ""} ${filled ? "" : "opacity-[0.42]"}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
      />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a3 3 0 1 0-2.83-4H15l-7 4-2.32-.77A3 3 0 1 0 6 11c.36 0 .71-.07 1.04-.18L15 15h.17A3 3 0 1 0 18 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareMenu({ compact }: { compact?: boolean }) {
  const { shareOpen, setShareOpen, copyLink, openShare, copied } = useEngagement();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShareOpen(!shareOpen)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-200 ${
          compact ? "" : "text-sm"
        }`}
        aria-expanded={shareOpen}
        aria-haspopup="true"
      >
        <IconShare className="opacity-70" />
        Share
      </button>
      {shareOpen ? (
        <div
          className="absolute right-0 z-20 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => openShare("whatsapp")}
          >
            WhatsApp
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => openShare("twitter")}
          >
            X (Twitter)
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => openShare("facebook")}
          >
            Facebook
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => void copyLink()}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ArticleEngagementTopBar() {
  const { views, likes, liked, toggleLike, likeBusy } = useEngagement();

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-5 dark:border-zinc-800/80">
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={likeBusy}
          className={`group inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1 transition active:scale-95 disabled:opacity-60 ${
            liked
              ? "text-emerald-700 dark:text-emerald-400"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
          }`}
          aria-pressed={liked}
        >
          <span
            className={`inline-flex transition-transform duration-200 ${liked ? "scale-110" : "group-hover:scale-105"}`}
          >
            <IconThumb filled={liked} className={liked ? "text-emerald-600 dark:text-emerald-400" : "opacity-70"} />
          </span>
          <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">{likes}</span>
          <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
        </button>

        <ShareMenu compact />

        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <IconEye className="opacity-60" />
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{views}</span>
          <span className="text-zinc-400 dark:text-zinc-500">views</span>
        </span>
      </div>
    </div>
  );
}

export function ArticleEngagementFooter() {
  const { likes, liked, toggleLike, likeBusy, openShare, copyLink, copied } = useEngagement();

  return (
    <section className="mt-14 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 px-5 py-8 dark:border-zinc-700/80 dark:bg-zinc-900/40 sm:px-8">
      <p className="text-center text-base font-medium text-zinc-800 dark:text-zinc-100">Was this helpful?</p>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={likeBusy}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
            liked
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100"
              : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-800"
          }`}
        >
          <IconThumb filled={liked} className={liked ? "text-emerald-600" : "opacity-70"} />
          Like this article
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">({likes})</span>
        </button>
      </div>

      <p className="mt-8 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">Share with others</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => openShare("whatsapp")}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => openShare("twitter")}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800"
        >
          X (Twitter)
        </button>
        <button
          type="button"
          onClick={() => openShare("facebook")}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800"
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
