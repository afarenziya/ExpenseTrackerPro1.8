import { Layout } from "@/components/layout/layout";
import { CategoryList } from "@/components/categories/category-list";

export default function CategoriesPage() {
  return (
    <Layout 
      title="Categories" 
      subtitle="Manage expense categories for better organization"
    >
      <CategoryList />
    </Layout>
  );
}
