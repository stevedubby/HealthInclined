import { notFound } from "next/navigation";
import AdminArticleEditor from "@/components/AdminArticleEditor";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategoriesAsync } from "@/lib/categories";
import { getAllPostsAdminAsync } from "@/lib/content/posts";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const [categories, posts] = await Promise.all([getCategoriesAsync(), getAllPostsAdminAsync()]);
  const allArticles = posts.map((p) => ({ slug: p.slug, title: p.title }));
  return (
    <AdminArticleEditor mode="edit" slug={slug} categories={categories} allArticles={allArticles} />
  );
}
