import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import ArticleContent from "@/components/ArticleContent";
import {
  ArticleEngagementFooter,
  ArticleEngagementProvider,
  ArticleEngagementTopBar,
} from "@/components/ArticleEngagement";
import VideoEmbed from "@/components/VideoEmbed";
import { estimateArticleReadMinutes } from "@/lib/article-read-time";
import { getPostBySlugAsync } from "@/lib/content/posts";
import { getCategoryBySlugAsync } from "@/lib/categories";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);
  if (!post) return {};

  const canonical = `${SITE.baseUrl}/blog/${post.slug}`;
  const metaTitle = (post.seoTitle?.trim() || post.title).trim();

  return {
    title: `${metaTitle} | Healthinclined`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: metaTitle,
      description: post.description,
      images: [{ url: `${SITE.baseUrl}/favicon.ico` }],
    },
    twitter: {
      card: "summary",
      title: metaTitle,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);
  if (!post) notFound();

  const category = await getCategoryBySlugAsync(post.category);

  const published = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const readMin = estimateArticleReadMinutes(post.content);
  const articleUrl = `${SITE.baseUrl}/blog/${post.slug}`;
  const views = post.views ?? 0;
  const likes = post.likes ?? 0;

  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/blog" className="font-semibold text-emerald-700 hover:underline underline-offset-4">
                Blog
              </Link>
            </li>
            {category ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/category/${category.slug}`}
                    className="font-semibold text-emerald-700 hover:underline underline-offset-4"
                  >
                    {category.name}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <article className="mt-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">{SITE.name}</span>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
              ·
            </span>
            <time dateTime={post.publishedAt}>{published}</time>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
              ·
            </span>
            <span>{readMin} min read</span>
          </p>

          <ArticleEngagementProvider
            slug={post.slug}
            initialViews={views}
            initialLikes={likes}
            articleUrl={articleUrl}
            title={post.title}
          >
            <ArticleEngagementTopBar />

            {post.video ? (
              <div className="mt-7">
                <VideoEmbed
                  platform={post.video.platform}
                  id={post.video.id}
                  title={post.video.title}
                />
              </div>
            ) : null}

            <div className="mt-7 max-w-none">
              <ArticleContent content={post.content} />
            </div>

            <ArticleEngagementFooter />
          </ArticleEngagementProvider>

          <section className="mt-12 border-t border-emerald-100 pt-8 dark:border-emerald-900">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Related Articles</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              If this matches what you’re noticing, these posts may help connect the dots:
            </p>

            <ul className="mt-4 space-y-3">
              {post.related.slice(0, 4).map((rel) => (
                <li
                  key={rel.slug}
                  className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900 dark:bg-zinc-900"
                >
                  <Link
                    href={`/blog/${rel.slug}`}
                    className="font-semibold text-emerald-800 hover:underline underline-offset-4"
                  >
                    {rel.anchor}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/blog"
              className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              Back to Blog
            </Link>
            <Link
              href="/videos"
              className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              Watch related videos →
            </Link>
          </div>
        </article>
      </div>
    </Container>
  );
}
