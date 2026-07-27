import type { Metadata } from "next";
import { CategoryManager } from "@/features/admin/catalog/category-manager";

export const metadata: Metadata = {
  title: "Категории — управление",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
