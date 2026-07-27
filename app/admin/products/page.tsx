import type { Metadata } from "next";
import { ProductManager } from "@/features/admin/catalog/product-manager";
import { loadAdminCatalog } from "@/features/catalog/server-repository";
import { CatalogProvider } from "@/features/catalog/store";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Товары — управление",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await requireActiveAdmin();
  const catalog = await loadAdminCatalog();

  return (
    <CatalogProvider initial={catalog} refreshMode="admin">
      <ProductManager />
    </CatalogProvider>
  );
}
