import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import VideoEmbed from "@/components/VideoEmbed";
import { getAllEmbeddedVideosAsync } from "@/lib/videos";
import { getCategoriesAsync } from "@/lib/categories";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Videos — short explanations for everyday symptoms",
  description:
    "Watch short Health Inclined videos on everyday body symptoms, then read the full articles for context and next steps.",
  alternates: {
    canonical: `${SITE.baseUrl}/videos`,
  },
  openGraph: {
    title: `Videos | ${SITE.name}`,
    description: "Short videos on everyday symptoms—paired with in-depth articles.",
    url: `${SITE.baseUrl}/videos`,
  },
};

export default async function VideosPage() {
  const videos = await getAllEmbeddedVideosAsync();
  const categories = await getCategoriesAsync();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Videos — short explanations for everyday symptoms
            </h1>
            <p className="mt-2 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
              From {SITE.name}: watch a quick clip, then open the full article for
              context and practical next steps.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
          >
            Browse Blog →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {videos.length === 0 ? (
            <p className="col-span-full text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              No videos yet. Add a YouTube or TikTok link to any article in the admin
              editor—those embeds are listed here and on the homepage automatically.
            </p>
          ) : null}
          {videos.map((video) => {
            const category = video.categorySlug ? categoryBySlug.get(video.categorySlug) ?? null : null;

            return (
              <section key={video.key} className="flex flex-col gap-3">
                {video.postSlug ? (
                  <Link href={`/blog/${video.postSlug}`} className="block">
                    <VideoEmbed platform={video.platform} id={video.id} title={video.title} />
                  </Link>
                ) : (
                  <VideoEmbed
                    platform={video.platform}
                    id={video.id}
                    title={video.title}
                  />
                )}

                <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900 dark:bg-zinc-900">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {video.title}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-700">
                    {category ? category.name : "Everyday symptoms"}
                  </div>
                  {video.postSlug ? (
                    <Link
                      href={`/blog/${video.postSlug}`}
                      className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
                    >
                      Read the article →
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Container>
  );
}

