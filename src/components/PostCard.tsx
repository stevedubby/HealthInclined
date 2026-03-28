import Link from "next/link";
import type { Post } from "@/lib/content/posts";

export default function PostCard({ post }: { post: Post }) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-emerald-900 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-emerald-700">{post.category}</span>
        <time className="text-xs font-medium text-zinc-500 dark:text-zinc-400" dateTime={post.publishedAt}>
          {date}
        </time>
      </div>

      <h3 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">
        <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
          {post.title}
        </Link>
      </h3>

      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{post.description}</p>

      <div className="mt-auto">
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}

