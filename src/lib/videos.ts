import { getAllPostsAsync, getPostCategorySlugs, type VideoSpec } from "@/lib/content/posts";

export type SiteVideo = {
  key: string; // stable unique key for React keys
  title: string;
  platform: VideoSpec["platform"];
  id: string;
  categorySlug?: string;
  postSlug?: string;
};

function videoKey(platform: VideoSpec["platform"], id: string) {
  return `${platform}:${id}`;
}

/** All videos come from published posts that have a video block (admin). No placeholder embeds. */
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
    }));

  const seen = new Set<string>();
  const unique: SiteVideo[] = [];
  for (const v of fromPosts) {
    if (seen.has(v.key)) continue;
    seen.add(v.key);
    unique.push(v);
  }

  return unique;
}
