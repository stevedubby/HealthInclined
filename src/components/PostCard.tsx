import Link from "next/link";
import type { Post } from "@/lib/content/posts";
import PostCategoryLinks from "@/components/PostCategoryLinks";
import { resolvePostThumbnailUrl } from "@/lib/post-thumbnail";

export default function PostCard({
  post,
  categoryNames,
}: {
  post: Post;
  /** Optional map slug → display name from `getCategoriesAsync`. */
  categoryNames?: Map<string, string>;
}) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const thumb = resolvePostThumbnailUrl(post.thumbnailUrl, post.content);

  return (
    <article className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:shadow-md dark:border-emerald-900 dark:bg-zinc-900">
      {thumb ? (
        <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-emerald-50 dark:bg-emerald-950/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote thumbnail URLs */}
          <img src={thumb} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <PostCategoryLinks post={post} nameBySlug={categoryNames} />
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
      </div>
    </article>
  );
}

