"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockCatalogSeed } from "@/data/catalog-seed";
import type { CatalogSnapshot, Category, Product } from "./types";

const catalogSeed = mockCatalogSeed;

type CatalogStore = CatalogSnapshot & {
  saveCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  resetCatalog: () => void;
};

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      categories: catalogSeed.categories,
      products: catalogSeed.products,
      saveCategory: (category) =>
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
        }),
      deleteCategory: (id) =>
        set((state) => {
          const remainingCategories = state.categories.map((category) =>
            category.parentId === id ? { ...category, parentId: null } : category,
          );

          return {
            categories: remainingCategories.filter(
              (category) => category.id !== id,
            ),
            products: state.products.map((product) => {
              const categoryIds = product.categoryIds.filter(
                (categoryId) => categoryId !== id,
              );
              const primaryCategoryId =
                product.primaryCategoryId === id
                  ? (categoryIds[0] ?? "")
                  : product.primaryCategoryId;

              return { ...product, categoryIds, primaryCategoryId };
            }),
          };
        }),
      saveProduct: (product) =>
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
        }),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),
      resetCatalog: () =>
        set({
          categories: catalogSeed.categories,
          products: catalogSeed.products,
        }),
    }),
    {
      name: "balloon-store-catalog",
      version: 1,
      partialize: (state) => ({
        categories: state.categories,
        products: state.products,
      }),
    },
  ),
);

export function getCatalogSeed(): CatalogSnapshot {
  return catalogSeed;
}
