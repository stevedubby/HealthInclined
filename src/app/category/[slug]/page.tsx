import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import { getPostsByCategory } from "@/lib/content/posts";
import { getCategoryBySlug } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);
  if (!category) return {};

  const canonical = `${SITE.baseUrl}/category/${category.slug}`;
  return {
    title: `${category.name} | Healthinclined`,
    description: category.shortDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${category.name} | Healthinclined`,
      description: category.shortDescription,
      images: [{ url: `${SITE.baseUrl}/favicon.ico` }],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();

  const posts = getPostsByCategory(category.slug);

  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {category.shortDescription}
            </p>
          </div>

          <div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              Back to Blog
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.length ? (
            posts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-emerald-100 bg-white p-6 text-sm leading-6 text-zinc-600 dark:border-emerald-900 dark:bg-zinc-900 dark:text-zinc-300">
              No posts yet in this category. Check back soon.
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

