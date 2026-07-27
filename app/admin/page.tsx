import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/catalog/admin-dashboard";
import { loadAdminCatalog } from "@/features/catalog/server-repository";
import { CatalogProvider } from "@/features/catalog/store";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Административная панель",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireActiveAdmin();
  const catalog = await loadAdminCatalog();

  return (
    <CatalogProvider initial={catalog} refreshMode="admin">
      <AdminDashboard />
    </CatalogProvider>
  );
}
