"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getPublishedCategories } from "@/features/catalog/selectors";
import { useCatalogStore } from "@/features/catalog/store";
import { useHydrated } from "@/lib/use-hydrated";
import { Skeleton } from "@/components/ui/skeleton";

const tones = [
  "bg-[#f1dfd5]",
  "bg-[#ded8ea]",
  "bg-[#e8e1d6]",
  "bg-[#dce6e7]",
  "bg-[#ead9e0]",
  "bg-[#efddd8]",
];

export function PopularCategories() {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);

  const popularCategories = useMemo(() => {
    const published = getPublishedCategories(categories);
    const parentIds = new Set(
      published.flatMap((category) =>
        category.parentId ? [category.parentId] : [],
      ),
    );

    return published
      .filter(
        (category) => category.parentId !== null || !parentIds.has(category.id),
      )
      .slice(0, 6);
  }, [categories]);

  if (!hydrated) {
    return (
      <div className="-mx-4 mt-8 grid auto-cols-[82%] grid-flow-col gap-3 overflow-hidden px-4 sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-[1.65rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-4 mt-8 grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
      {popularCategories.map((category, index) => (
        <Link
          key={category.id}
          href={`/catalog/${category.slug}`}
          className="interactive-card group flex min-h-44 snap-start flex-col justify-between rounded-[1.65rem] border border-[#e5dbd6] bg-white p-5 sm:min-h-48 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <span
              className={`flex size-12 items-center justify-center rounded-full ${tones[index % tones.length]} text-xs font-black text-[#4b3944]`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex size-9 items-center justify-center rounded-full border border-[#dfd3d7] text-[#8d2444] transition group-hover:bg-[#a42a4d] group-hover:text-white">
              <span aria-hidden="true">↗</span>
            </span>
          </div>
          <div className="mt-7">
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-[#30242d]">
              {category.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#7a6c74]">
              {category.shortDescription}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
