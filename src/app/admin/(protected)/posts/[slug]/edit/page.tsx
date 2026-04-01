import { notFound } from "next/navigation";
import AdminArticleEditor from "@/components/AdminArticleEditor";
import { isValidSlug } from "@/lib/admin-posts";
import { getCategoriesAsync } from "@/lib/categories";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const categories = await getCategoriesAsync();
  return <AdminArticleEditor mode="edit" slug={slug} categories={categories} />;
}
