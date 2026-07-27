"use client";

import { useMemo } from "react";
import { ProductCard } from "./product-card";
import { CatalogSkeleton } from "./catalog-skeleton";
import { getPublishedProducts } from "@/features/catalog/selectors";
import { useCatalogStore } from "@/features/catalog/store";
import { useHydrated } from "@/lib/use-hydrated";

export function FeaturedProducts() {
  const hydrated = useHydrated();
  const products = useCatalogStore((state) => state.products);

  const featuredProducts = useMemo(
    () =>
      getPublishedProducts(products)
        .filter((product) => product.isBestseller || product.isRecommended)
        .sort(
          (first, second) =>
            Number(second.isBestseller) - Number(first.isBestseller) ||
            first.sortOrder - second.sortOrder,
        )
        .slice(0, 3),
    [products],
  );

  if (!hydrated) {
    return <CatalogSkeleton />;
  }

  return (
    <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {featuredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          headingLevel="h3"
        />
      ))}
    </div>
  );
}
