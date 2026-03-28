"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminUnpublishButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unpublish() {
    if (!window.confirm("Unpublish this article? It will disappear from the public site until you publish again.")) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: false }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={loading}
        onClick={() => void unpublish()}
        className="font-semibold text-amber-700 hover:text-amber-600 disabled:opacity-50 dark:text-amber-400 dark:hover:text-amber-300"
      >
        {loading ? "…" : "Unpublish"}
      </button>
      {error ? <span className="max-w-[140px] text-right text-[10px] text-red-600 dark:text-red-400">{error}</span> : null}
    </span>
  );
}
