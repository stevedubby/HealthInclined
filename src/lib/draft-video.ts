import type { VideoSpec } from "@/lib/content/posts";
import { parseTikTokVideoId } from "@/lib/tiktok-id";
import { parseYoutubeVideoId } from "@/lib/youtube-id";

/**
 * Draft autosave sends optional video fields. Returns:
 * - `null` — both platform and id empty → clear stored video
 * - `undefined` — incomplete or unparsable → leave DB unchanged
 * - `VideoSpec` — set video
 */
export function resolveDraftAutosaveVideo(body: {
  videoPlatform?: unknown;
  videoId?: unknown;
  videoTitle?: unknown;
}): VideoSpec | null | undefined {
  const hasVideoKeys =
    Object.prototype.hasOwnProperty.call(body, "videoPlatform") ||
    Object.prototype.hasOwnProperty.call(body, "videoId") ||
    Object.prototype.hasOwnProperty.call(body, "videoTitle");
  if (!hasVideoKeys) return undefined;

  const vp = String(body.videoPlatform ?? "").trim();
  const vidRaw = String(body.videoId ?? "").trim();
  const titleTrim = String(body.videoTitle ?? "").trim();

  if (!vp && !vidRaw) return null;
  if (!vp || !vidRaw) return undefined;

  if (vp === "youtube") {
    const id = parseYoutubeVideoId(vidRaw);
    if (!id) return undefined;
    return { platform: "youtube", id, title: titleTrim || undefined };
  }
  if (vp === "tiktok") {
    const id = parseTikTokVideoId(vidRaw);
    if (!id) return undefined;
    return { platform: "tiktok", id, title: titleTrim || undefined };
  }
  return undefined;
}
