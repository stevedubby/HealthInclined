import AdminArticleEditor from "@/components/AdminArticleEditor";
import { getCategories } from "@/lib/categories";

export default function AdminNewPostPage() {
  const categories = getCategories();
  return <AdminArticleEditor mode="new" categories={categories} />;
}
