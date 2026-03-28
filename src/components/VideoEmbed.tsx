import type { VideoSpec } from "@/lib/content/posts";

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
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      id,
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

