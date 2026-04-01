/**
 * Extracts the numeric TikTok video ID for embed URLs from a plain ID or a full
 * share link like https://www.tiktok.com/@user/video/7123456789012345678
 *
 * Short links (vm.tiktok.com/…) without a /video/ path cannot be resolved here;
 * open the link in a browser and paste the full URL from the address bar.
 */
export function parseTikTokVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^\d{8,}$/.test(raw)) {
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

    if (host === "tiktok.com" || host === "m.tiktok.com") {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }

  const loose = decoded.match(/\/video\/(\d+)/);
  if (loose) return loose[1];

  return null;
}
