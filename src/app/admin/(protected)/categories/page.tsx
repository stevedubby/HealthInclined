import AdminCategoriesManager from "@/components/AdminCategoriesManager";
import { getCategories } from "@/lib/categories";
import { getAllPostsAdmin } from "@/lib/content/posts";

export default function AdminCategoriesPage() {
  const categories = getCategories();
  const posts = getAllPostsAdmin();

  const postCounts: Record<string, { total: number; live: number }> = {};
  for (const c of categories) {
    postCounts[c.slug] = { total: 0, live: 0 };
  }
  for (const p of posts) {
    const cur = postCounts[p.category];
    if (cur) {
      cur.total += 1;
      if (p.published !== false) cur.live += 1;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/90">
          Organization
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Categories</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Create pillars for your content. They power public category pages and the article editor. Delete is only
          allowed when no articles use that category.
        </p>
      </div>

      <AdminCategoriesManager initialCategories={categories} postCounts={postCounts} />
    </div>
  );
}
