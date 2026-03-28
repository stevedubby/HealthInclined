import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import VideoEmbed from "@/components/VideoEmbed";
import { getAllEmbeddedVideos } from "@/lib/videos";
import { getCategoryBySlug } from "@/lib/categories";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Video Library | Healthinclined",
  description: "Short, simple explanations for everyday body symptoms.",
  alternates: {
    canonical: `${SITE.baseUrl}/videos`,
  },
};

export default function VideosPage() {
  const videos = getAllEmbeddedVideos();

  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Video Library
            </h1>
            <p className="mt-2 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Watch short explanations, then read the matching posts for practical
              next steps.
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
          {videos.map((video) => {
            const category = video.categorySlug
              ? getCategoryBySlug(video.categorySlug)
              : null;

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

