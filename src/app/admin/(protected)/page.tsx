import Link from "next/link";
import AdminThemeToggle from "@/components/AdminThemeToggle";
import AdminUnpublishButton from "@/components/AdminUnpublishButton";
import { getCategoriesAsync } from "@/lib/categories";
import { getAllPostsAdminAsync } from "@/lib/content/posts";

export default async function AdminDashboardPage() {
  const posts = await getAllPostsAdminAsync();
  const categories = await getCategoriesAsync();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const live = posts.filter((p) => p.published !== false).length;
  const drafts = posts.length - live;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/90">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Your content hub
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Create articles, tune SEO for Google, assign categories, then publish when you’re ready.
            Drafts stay private until you publish.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex justify-center sm:justify-start">
            <AdminThemeToggle />
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/25 dark:hover:bg-emerald-400"
          >
            Create new article
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{posts.length}</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Articles in library</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-500/80">
            Live
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{live}</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Visible on the site</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-950/10">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-500/80">
            Drafts
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-200">{drafts}</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Not public yet</div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">All articles</h2>
          <Link
            href="/admin/categories"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Manage categories →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-500">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="hidden px-4 py-3 sm:table-cell">Slug</th>
                <th className="px-4 py-3">Category</th>
                <th className="hidden px-4 py-3 md:table-cell">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {posts.map((p) => {
                const isLive = p.published !== false;
                const cat = categoryBySlug.get(p.category);
                return (
                  <tr key={p.slug} className="text-zinc-700 dark:text-zinc-300">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-500 sm:hidden">
                        {p.slug}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-zinc-500 sm:table-cell">
                      {p.slug}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {cat?.name ?? p.category}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">{p.publishedAt}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isLive
                            ? "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-400 dark:ring-emerald-500/30"
                            : "bg-amber-500/10 text-amber-900 ring-1 ring-amber-500/20 dark:text-amber-200 dark:ring-amber-500/25"
                        }`}
                      >
                        {isLive ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                        {isLive ? (
                          <>
                            <Link
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              View
                            </Link>
                            <AdminUnpublishButton slug={p.slug} />
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
                        )}
                        <Link
                          href={`/admin/posts/${p.slug}/edit`}
                          className="font-semibold text-zinc-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {posts.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">
              No articles yet. Create your first one to get started.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
