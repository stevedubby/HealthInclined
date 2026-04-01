import type { VideoSpec } from "@/lib/content/posts";
import { parseYoutubeVideoId } from "@/lib/youtube-id";

export default function VideoEmbed({
  platform,
  id,
  title,
}: {
  platform: VideoSpec["platform"];
  id: string;
  title?: string;
}) {
  if (!id) return null;

  if (platform === "youtube") {
    const normalized = parseYoutubeVideoId(id);
    if (!normalized) {
      return (
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">Video could not be embedded</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
            Edit this post in admin and set the video to a Shorts link, watch URL, or the 11-character YouTube ID — not a
            pasted page URL in the ID field only.
          </p>
        </div>
      );
    }
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      normalized,
    )}?rel=0&modestbranding=1`;

    return (
      <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
        <div className="aspect-video">
          <iframe
            title={title ?? "Video"}
            src={src}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // TikTok embed (foundation: replace IDs with your own)
  const src = `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}?lang=en`;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
      <div className="aspect-[9/16]">
        <iframe
          title={title ?? "TikTok video"}
          src={src}
          className="h-full w-full"
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

