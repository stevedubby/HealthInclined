import Link from "next/link";
import { getPostCategorySlugs, type Post } from "@/lib/content/posts";

export default function PostCategoryLinks({
  post,
  nameBySlug,
  className = "text-xs font-semibold text-emerald-700 dark:text-emerald-400",
}: {
  post: Post;
  /** Optional display names (e.g. from `getCategoriesAsync`). */
  nameBySlug?: Map<string, string>;
  className?: string;
}) {
  const slugs = getPostCategorySlugs(post);
  if (!slugs.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {slugs.map((slug, i) => (
        <span key={slug} className="inline-flex items-center gap-x-2">
          {i > 0 ? (
            <span className="text-emerald-400/80 dark:text-emerald-600" aria-hidden>
              ·
            </span>
          ) : null}
          <Link href={`/category/${slug}`} className={`${className} hover:underline underline-offset-4`}>
            {nameBySlug?.get(slug) ?? slug.replace(/-/g, " ")}
          </Link>
        </span>
      ))}
    </span>
  );
}
