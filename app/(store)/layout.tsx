import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { loadPublicCatalog } from "@/features/catalog/server-repository";
import { CatalogProvider } from "@/features/catalog/store";

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await loadPublicCatalog();

  return (
    <CatalogProvider initial={catalog}>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-[#281d28] px-5 py-3 text-sm font-bold text-white transition focus:translate-y-0"
      >
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </CatalogProvider>
  );
}
