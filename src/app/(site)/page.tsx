import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import CategoryTile from "@/components/CategoryTile";
import VideoEmbed from "@/components/VideoEmbed";
import HomeSearch from "@/components/HomeSearch";
import PostCategoryLinks from "@/components/PostCategoryLinks";
import HomeJsonLd from "@/components/HomeJsonLd";
import {
  getAllPostsAsync,
  getFeaturedPostAsync,
  getLatestPublicPostsAsync,
  getPublishedArticleCountsByCategoryAsync,
} from "@/lib/content/posts";
import { getCategoriesAsync } from "@/lib/categories";
import { resolvePostThumbnailUrl } from "@/lib/post-thumbnail";
import { SITE } from "@/lib/site";
import { getAllEmbeddedVideosAsync } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Everyday body symptoms, explained simply",
  description: SITE.description,
  alternates: { canonical: SITE.baseUrl },
  openGraph: {
    title: `${SITE.name} — everyday symptoms, explained simply`,
    description: SITE.description,
    url: SITE.baseUrl,
    type: "website",
  },
};

export default async function Home() {
  const categories = await getCategoriesAsync();
  const posts = await getAllPostsAsync();
  const highlightedCategory = categories.find((c) => c.highlight) ?? categories[0] ?? null;
  const featured = posts.slice(0, 6);
  const homeFeatured = await getFeaturedPostAsync();
  const latestPosts = await getLatestPublicPostsAsync(12, homeFeatured?.slug);
  const categoryArticleCounts = await getPublishedArticleCountsByCategoryAsync();
  const featuredThumb = homeFeatured
    ? resolvePostThumbnailUrl(homeFeatured.thumbnailUrl, homeFeatured.content)
    : null;
  const videos = await getAllEmbeddedVideosAsync();
  const primaryVideo = videos[0];
  const secondaryVideo = videos[1];
  const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950 before:absolute before:inset-0 before:-z-10 before:content-[''] before:bg-[radial-gradient(60%_60%_at_0%_0%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(55%_55%_at_90%_0%,rgba(16,185,129,0.10),transparent_55%),linear-gradient(to_bottom,rgba(16,185,129,0.08),transparent_45%)] dark:before:bg-[radial-gradient(60%_60%_at_0%_0%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(55%_55%_at_90%_0%,rgba(16,185,129,0.14),transparent_55%),linear-gradient(to_bottom,rgba(16,185,129,0.10),transparent_48%)]">
      <HomeJsonLd />
      <section className="pt-10 sm:pt-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300">
                {SITE.name} · everyday health education
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                Understand What Your Body Is Telling You
              </h1>

              <p className="mt-4 max-w-prose text-lg leading-7 text-zinc-700 dark:text-zinc-300">
                Simple, science-backed explanations for common body symptoms.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Start Reading
                </Link>
                <Link
                  href={highlightedCategory ? `/category/${highlightedCategory.slug}` : "/blog"}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-6 py-3 text-base font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800"
                >
                  {highlightedCategory?.name ?? "Explore categories"}
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900 dark:bg-zinc-900">
                  <div className="text-sm font-semibold text-emerald-900">
                    Simple language
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Written for everyday readers.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900 dark:bg-zinc-900">
                  <div className="text-sm font-semibold text-emerald-900">
                    Practical steps
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    What you can do today.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-emerald-900">
                    New to {SITE.name}?
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-400 dark:text-zinc-400">
                    Start with a body-signal post, then explore related topics.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {featured.slice(0, 3).map((post) => (
                  <div
                    key={post.slug}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
                  >
                    <PostCategoryLinks post={post} nameBySlug={categoryNames} />
                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-2 block text-sm font-bold leading-6 text-zinc-900 hover:underline underline-offset-4 dark:text-zinc-100"
                    >
                      {post.title}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Tip: Save posts you like and revisit when symptoms come back.
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-10 sm:pt-12" aria-labelledby="explore-site-heading">
        <Container>
          <h2
            id="explore-site-heading"
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
          >
            Explore {SITE.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Jump to the main sections of the site—clear titles and internal links help
            readers (and search engines) find articles, videos, and categories quickly.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <Link
                href="/blog"
                className="block rounded-2xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Health articles &amp; blog
                </span>
                <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Symptom guides and education posts, newest first.
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/videos"
                className="block rounded-2xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Video library
                </span>
                <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Short explainers paired with full articles.
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="block rounded-2xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  About {SITE.name}
                </span>
                <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Mission, approach, and how content is written.
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={highlightedCategory ? `/category/${highlightedCategory.slug}` : "/blog"}
                className="block rounded-2xl border border-emerald-100 bg-white p-4 transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Browse categories
                </span>
                <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {highlightedCategory
                    ? `Start with ${highlightedCategory.name}, then explore the rest.`
                    : "Organized topics for everyday body signals."}
                </span>
              </Link>
            </li>
          </ul>
        </Container>
      </section>

      <section className="pt-10 sm:pt-12">
        <Container>
          <HomeSearch />
        </Container>
      </section>

      <section className="pt-12 sm:pt-16">
        <Container>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Categories
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Choose a content pillar and learn the patterns behind everyday body signals.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <CategoryTile
                key={c.slug}
                category={c}
                articleCount={categoryArticleCounts[c.slug] ?? 0}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-12 sm:pt-16">
        <Container>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Featured article
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Hand-picked from the library — updated from your admin dashboard.
          </p>

          {homeFeatured ? (
            <article className="mt-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900 dark:bg-zinc-900">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr] lg:items-stretch">
                {featuredThumb ? (
                  <Link
                    href={`/blog/${homeFeatured.slug}`}
                    className="relative block aspect-[16/10] min-h-[200px] bg-emerald-50 dark:bg-emerald-950/40 lg:aspect-auto lg:min-h-[280px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredThumb}
                      alt={homeFeatured.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                    />
                  </Link>
                ) : null}
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <PostCategoryLinks
                      post={homeFeatured}
                      nameBySlug={categoryNames}
                      className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                    <Link href={`/blog/${homeFeatured.slug}`} className="hover:underline underline-offset-4">
                      {homeFeatured.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                    {homeFeatured.description}
                  </p>
                  <div className="mt-6">
                    <Link
                      href={`/blog/${homeFeatured.slug}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      Read article
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              No featured article is set yet. In the admin, edit an article and enable &quot;Mark as featured&quot;.
            </p>
          )}
        </Container>
      </section>

      <section className="pt-12 sm:pt-16">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Latest articles
            </h2>
            <Link
              href="/blog"
              className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              View all →
            </Link>
          </div>
          <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Newest first by creation date.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} categoryNames={categoryNames} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-12 sm:pt-16">
        <Container>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-8 dark:border-emerald-900 dark:bg-emerald-950/25">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <div className="text-sm font-semibold text-emerald-800">
                  Why Your Body Does This
                </div>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                  A clear series for everyday symptoms
                </h2>
                <p className="mt-3 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  Start with body-signal explanations, then follow related links to
                  understand how nerves, sleep, and daily habits can connect.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-emerald-800 dark:bg-zinc-900">
                <div className="text-sm font-semibold text-emerald-900">
                  Recommended next step
                </div>
                <Link
                  href={highlightedCategory ? `/category/${highlightedCategory.slug}` : "/blog"}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-800"
                >
                  {highlightedCategory ? `Explore ${highlightedCategory.name}` : "Explore categories"}
                </Link>
                <div className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Built for short-form traffic: quick context, simple steps, and
                  clear “what to notice” guidance.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-12 sm:pt-16">
        <Container>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Videos (Short + Simple)
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Watch a quick explanation, then read the full article for practical next steps.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {primaryVideo ? (
              <VideoEmbed
                platform={primaryVideo.platform}
                id={primaryVideo.id}
                title={primaryVideo.title}
              />
            ) : null}
            {secondaryVideo ? (
              <VideoEmbed
                platform={secondaryVideo.platform}
                id={secondaryVideo.id}
                title={secondaryVideo.title}
              />
            ) : null}
          </div>

          <div className="mt-6">
            <Link
              href="/videos"
              className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              Browse the full video library →
            </Link>
          </div>
        </Container>
      </section>

      <section className="pt-12 pb-16 sm:pt-16">
        <Container>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 dark:border-emerald-900 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Trust, without the drama
            </h2>
            <p className="mt-3 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {SITE.trustLine}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              You’ll see plain language, clear “normal vs notice” guidance, and practical
              options for what you can do next.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

