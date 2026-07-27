import type { CatalogSnapshot, Category, Product } from "./types";

export interface CatalogRepository {
  getSnapshot(): Promise<CatalogSnapshot>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  saveProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export const catalogStorageNotes = {
  current:
    "Тестовый адаптер Zustand сохраняет изменения локально в браузере.",
  future:
    "SupabaseCatalogRepository реализует тот же интерфейс без изменений компонентов каталога.",
} as const;
