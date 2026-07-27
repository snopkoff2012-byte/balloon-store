"use client";

import Link from "next/link";
import { useCatalogStore } from "@/features/catalog/store";
import { getPublishedCategories } from "@/features/catalog/selectors";
import { useHydrated } from "@/lib/use-hydrated";

export function CategoryNavigation() {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);

  if (!hydrated) {
    return <div className="h-28 animate-pulse rounded-[1.75rem] bg-[#eee5e0]" />;
  }

  const published = getPublishedCategories(categories);
  const roots = published
    .filter((category) => !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <nav aria-label="Категории товаров" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {roots.map((category) => {
        const children = published
          .filter((item) => item.parentId === category.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div
            key={category.id}
            className="rounded-[1.5rem] border border-[#e5dbd6] bg-white p-5"
          >
            <Link
              href={`/catalog/${category.slug}`}
              className="text-lg font-extrabold text-[#342831] transition hover:text-[#962847]"
            >
              {category.name}
            </Link>
            {children.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/catalog/${child.slug}`}
                    className="rounded-full bg-[#f4eeea] px-3 py-2 text-xs font-bold text-[#6f6069] transition hover:bg-[#ead9df] hover:text-[#84233f]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#82747c]">
                {category.shortDescription}
              </p>
            )}
          </div>
        );
      })}
    </nav>
  );
}
