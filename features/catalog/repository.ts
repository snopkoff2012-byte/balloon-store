import type { CatalogSnapshot, Category, Product } from "./types";

export type CatalogSource = "supabase" | "fallback";

export type CatalogLoadResult = {
  snapshot: CatalogSnapshot;
  source: CatalogSource;
  error: string | null;
};

export interface CatalogRepository {
  getSnapshot(): Promise<CatalogSnapshot>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  saveProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}
