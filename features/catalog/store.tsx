"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { mockCatalogSeed } from "@/data/catalog-seed";
import { isSupabaseConfigured } from "@/lib/environment";
import {
  deleteCategoryFromSupabase,
  deleteProductFromSupabase,
  loadCatalogFromSupabaseBrowser,
  saveCategoryToSupabase,
  saveProductToSupabase,
} from "./browser-repository";
import type { CatalogLoadResult, CatalogSource } from "./repository";
import type { CatalogSnapshot, Category, Product } from "./types";

type CatalogState = CatalogSnapshot & {
  source: CatalogSource;
  loadError: string | null;
  isRefreshing: boolean;
  refreshCatalog: (admin: boolean) => Promise<void>;
  saveCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  saveProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  resetCatalog: () => Promise<void>;
};

type CatalogStoreApi = StoreApi<CatalogState>;

const CatalogStoreContext = createContext<CatalogStoreApi | null>(null);

function createCatalogStore(initial: CatalogLoadResult) {
  return createStore<CatalogState>()((set) => ({
    categories: initial.snapshot.categories,
    products: initial.snapshot.products,
    source: initial.source,
    loadError: initial.error,
    isRefreshing: false,
    refreshCatalog: async (admin) => {
      set({ isRefreshing: true });
      try {
        const snapshot = await loadCatalogFromSupabaseBrowser({ admin });
        set({
          ...snapshot,
          source: "supabase",
          loadError: null,
          isRefreshing: false,
        });
      } catch {
        set({
          isRefreshing: false,
          loadError:
            "Не удалось обновить данные из Supabase. Показан резервный каталог.",
        });
      }
    },
    saveCategory: async (category) => {
      if (isSupabaseConfigured()) {
        await saveCategoryToSupabase(category);
      }
      set((state) => {
        const exists = state.categories.some(
          (current) => current.id === category.id,
        );
        return {
          categories: exists
            ? state.categories.map((current) =>
                current.id === category.id ? category : current,
              )
            : [...state.categories, category],
        };
      });
      return category;
    },
    deleteCategory: async (id) => {
      if (isSupabaseConfigured()) {
        await deleteCategoryFromSupabase(id);
      }
      set((state) => ({
        categories: state.categories
          .map((category) =>
            category.parentId === id ? { ...category, parentId: null } : category,
          )
          .filter((category) => category.id !== id),
        products: state.products.map((product) => {
          const categoryIds = product.categoryIds.filter(
            (categoryId) => categoryId !== id,
          );
          return {
            ...product,
            categoryIds,
            primaryCategoryId:
              product.primaryCategoryId === id
                ? (categoryIds[0] ?? "")
                : product.primaryCategoryId,
          };
        }),
      }));
    },
    saveProduct: async (product) => {
      if (isSupabaseConfigured()) {
        await saveProductToSupabase(product);
      }
      set((state) => {
        const exists = state.products.some(
          (current) => current.id === product.id,
        );
        return {
          products: exists
            ? state.products.map((current) =>
                current.id === product.id ? product : current,
              )
            : [...state.products, product],
        };
      });
      return product;
    },
    deleteProduct: async (id) => {
      if (isSupabaseConfigured()) {
        await deleteProductFromSupabase(id);
      }
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
      }));
    },
    resetCatalog: async () => {
      if (isSupabaseConfigured()) {
        throw new Error(
          "Сброс базы из административной панели отключён из соображений безопасности.",
        );
      }
      set({
        categories: mockCatalogSeed.categories,
        products: mockCatalogSeed.products,
        source: "fallback",
        loadError: initial.error,
      });
    },
  }));
}

export function CatalogProvider({
  initial,
  children,
  refreshMode = "public",
}: {
  initial: CatalogLoadResult;
  children: ReactNode;
  refreshMode?: "public" | "admin";
}) {
  const [store] = useState(() => createCatalogStore(initial));
  useEffect(() => {
    if (initial.source === "fallback" && isSupabaseConfigured()) {
      void store.getState().refreshCatalog(refreshMode === "admin");
    }
  }, [initial.source, refreshMode, store]);

  return (
    <CatalogStoreContext.Provider value={store}>
      <CatalogStatus />
      {children}
    </CatalogStoreContext.Provider>
  );
}

function CatalogStatus() {
  const pathname = usePathname();
  const error = useCatalogStore((state) => state.loadError);
  const isRefreshing = useCatalogStore((state) => state.isRefreshing);
  if (pathname.startsWith("/admin")) return null;
  if (!error && !isRefreshing) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900"
    >
      {isRefreshing ? "Обновляем каталог из Supabase…" : error}
    </div>
  );
}

export function useCatalogStore<T>(selector: (state: CatalogState) => T): T {
  const store = useContext(CatalogStoreContext);
  if (!store) {
    throw new Error("CatalogProvider is missing");
  }
  return useStore(store, selector);
}
