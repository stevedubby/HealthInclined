import AdminArticleEditor from "@/components/AdminArticleEditor";
import { getCategoriesAsync } from "@/lib/categories";
import { getAllPostsAdminAsync } from "@/lib/content/posts";

export default async function AdminNewPostPage() {
  const [categories, posts] = await Promise.all([getCategoriesAsync(), getAllPostsAdminAsync()]);
  const allArticles = posts.map((p) => ({ slug: p.slug, title: p.title }));
  return <AdminArticleEditor mode="new" categories={categories} allArticles={allArticles} />;
}
