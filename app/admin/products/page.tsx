import type { Metadata } from "next";
import { ProductManager } from "@/features/admin/catalog/product-manager";

export const metadata: Metadata = {
  title: "Товары — управление",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return <ProductManager />;
}
