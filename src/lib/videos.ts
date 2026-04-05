import { getAllPostsAsync, getPostCategorySlugs, type VideoSpec } from "@/lib/content/posts";

export type SiteVideo = {
  key: string; // stable unique key for React keys
  title: string;
  platform: VideoSpec["platform"];
  id: string;
  categorySlug?: string;
  postSlug?: string;
  source: "post" | "library";
};

const STATIC_VIDEOS: Array<Omit<SiteVideo, "key">> = [
  {
    title: "Sleep signals: snoring and nighttime recovery",
    platform: "youtube",
    id: "M7lc1UVf-VE",
    categorySlug: "sleep",
    source: "library",
  },
  {
    title: "Tingling signals: nerves and temporary compression",
    platform: "tiktok",
    id: "7301234567890123456",
    categorySlug: "nerves-circulation",
    source: "library",
  },
];

function videoKey(platform: VideoSpec["platform"], id: string) {
  return `${platform}:${id}`;
}

export async function getAllEmbeddedVideosAsync(): Promise<SiteVideo[]> {
  const fromPosts = (await getAllPostsAsync())
    .filter((p) => p.video?.id)
    .map((p) => ({
      key: videoKey(p.video!.platform, p.video!.id),
      title: p.video!.title ?? p.title,
      platform: p.video!.platform,
      id: p.video!.id,
      categorySlug: getPostCategorySlugs(p)[0],
      postSlug: p.slug,
      source: "post" as const,
    }));

  const fromLibrary = STATIC_VIDEOS.map((v) => ({
    key: videoKey(v.platform, v.id),
    ...v,
  }));

  const all = [...fromLibrary, ...fromPosts];

  // De-dupe by platform+id
  const seen = new Set<string>();
  const unique: SiteVideo[] = [];
  for (const v of all) {
    if (seen.has(v.key)) continue;
    seen.add(v.key);
    unique.push(v);
  }

  return unique;
}

