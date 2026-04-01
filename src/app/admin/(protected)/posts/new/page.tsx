import AdminArticleEditor from "@/components/AdminArticleEditor";
import { getCategoriesAsync } from "@/lib/categories";

export default async function AdminNewPostPage() {
  const categories = await getCategoriesAsync();
  return <AdminArticleEditor mode="new" categories={categories} />;
}
