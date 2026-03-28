import { notFound } from "next/navigation";
import AdminArticleEditor from "@/components/AdminArticleEditor";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategories } from "@/lib/categories";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const categories = getCategories();
  return <AdminArticleEditor mode="edit" slug={slug} categories={categories} />;
}
