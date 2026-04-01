/**
 * Extracts the 11-character YouTube video ID from a plain ID, watch URL,
 * Shorts URL, youtu.be link, or embed URL.
 */
export function parseYoutubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }

  try {
    const withProtocol = decoded.includes("://") ? decoded : `https://${decoded}`;
    const u = new URL(withProtocol);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const seg = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      if (seg && /^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "www.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "www.youtube-nocookie.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      const seg = parts[1]?.split("?")[0];
      if (
        seg &&
        /^[a-zA-Z0-9_-]{11}$/.test(seg) &&
        (kind === "embed" || kind === "shorts" || kind === "short" || kind === "live")
      ) {
        return seg;
      }
    }
  } catch {
    /* fall through */
  }

  const m = decoded.match(
    /(?:youtu\.be\/|\/shorts\/|\/short\/|\/embed\/|\/live\/|[?&]v=)([a-zA-Z0-9_-]{11})/,
  );
  if (m?.[1] && /^[a-zA-Z0-9_-]{11}$/.test(m[1])) {
    return m[1];
  }

  return null;
}
