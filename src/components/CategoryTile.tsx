import Link from "next/link";
import type { Category } from "@/lib/categories";

export default function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={`group flex h-full flex-col gap-3 rounded-2xl border p-5 transition hover:shadow-sm ${
        category.highlight
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-emerald-100 bg-white dark:border-emerald-900 dark:bg-zinc-900"
      }`}
    >
      <div className="text-sm font-semibold text-emerald-800">
        {category.name}
      </div>
      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{category.shortDescription}</p>
      <span className="mt-auto text-sm font-semibold text-emerald-700 transition group-hover:underline underline-offset-4">
        Explore
      </span>
    </Link>
  );
}

