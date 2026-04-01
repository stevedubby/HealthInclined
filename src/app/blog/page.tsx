import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import { getAllPostsAsync } from "@/lib/content/posts";
import { getCategoriesAsync } from "@/lib/categories";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog | Healthinclined",
  description:
    "Simple health education about everyday body symptoms, organized into clear categories.",
  alternates: {
    canonical: `${SITE.baseUrl}/blog`,
  },
};

export default async function BlogIndex() {
  const categories = await getCategoriesAsync();
  const posts = await getAllPostsAsync();

  return (
    <Container>
      <div className="pt-8 sm:pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Blog
            </h1>
            <p className="mt-2 max-w-prose text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Explore calm, simple explanations for everyday symptoms and health
              education.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </Container>
  );
}

