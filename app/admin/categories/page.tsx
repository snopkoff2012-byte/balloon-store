import type { Metadata } from "next";
import { CategoryManager } from "@/features/admin/catalog/category-manager";
import { loadAdminCatalog } from "@/features/catalog/server-repository";
import { CatalogProvider } from "@/features/catalog/store";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Категории — управление",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requireActiveAdmin();
  const catalog = await loadAdminCatalog();

  return (
    <CatalogProvider initial={catalog} refreshMode="admin">
      <CategoryManager />
    </CatalogProvider>
  );
}
