"use client";

import Link from "next/link";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { Container } from "@/components/ui/container";
import { CatalogBrowser } from "./catalog-browser";
import {
  getCategoryChildren,
  getCategoryTrail,
} from "@/features/catalog/selectors";
import { useCatalogStore } from "@/features/catalog/store";
import { useHydrated } from "@/lib/use-hydrated";

export function CategoryView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);

  if (!hydrated) {
    return (
      <Container className="py-10">
        <div className="h-80 animate-pulse rounded-[2rem] bg-[#eee5e0]" />
      </Container>
    );
  }

  const category = categories.find(
    (item) => item.slug === slug && item.publicationStatus === "published",
  );

  if (!category) {
    return (
      <Container className="py-16">
        <div className="rounded-[2rem] border border-dashed border-[#d9c7cd] bg-white p-10 text-center">
          <h1 className="font-display text-3xl text-[#342831]">
            Категория недоступна
          </h1>
          <p className="mt-3 text-[#776a72]">
            Возможно, она временно скрыта или была удалена.
          </p>
          <Link href="/catalog" className="button-primary mt-6">
            Вернуться в каталог
          </Link>
        </div>
      </Container>
    );
  }

  const breadcrumbs = getCategoryTrail(categories, category.id);
  const children = getCategoryChildren(categories, category.id).filter(
    (item) => item.publicationStatus === "published",
  );

  return (
    <Container className="py-10 sm:py-14">
      <nav
        aria-label="Хлебные крошки"
        className="flex flex-wrap items-center gap-2 text-sm text-[#887a82]"
      >
        <Link href="/" className="hover:text-[#8d2444]">
          Главная
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/catalog" className="hover:text-[#8d2444]">
          Каталог
        </Link>
        {breadcrumbs.map((item) => (
          <span key={item.id} className="contents">
            <span aria-hidden="true">/</span>
            {item.id === category.id ? (
              <span aria-current="page" className="text-[#4a3b44]">
                {item.name}
              </span>
            ) : (
              <Link
                href={`/catalog/${item.slug}`}
                className="hover:text-[#8d2444]"
              >
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <section className="mt-7 overflow-hidden rounded-[2rem] bg-[#f1ebe6] sm:rounded-[2.5rem]">
        <div className="grid sm:grid-cols-[1fr_280px]">
          <div className="p-7 sm:p-11">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a2b4b]">
              Категория
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-[#342831] sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-[#74666f]">
              {category.fullDescription}
            </p>
          </div>
          <BalloonPhotoPlaceholder
            variant="product"
            compact
            className="min-h-64 sm:min-h-full"
            label={`Фотография категории «${category.name}»`}
          />
        </div>
      </section>

      {children.length > 0 ? (
        <section className="mt-8" aria-labelledby="subcategories-title">
          <h2 id="subcategories-title" className="text-xl font-extrabold text-[#342831]">
            Подкатегории
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/catalog/${child.slug}`}
                className="rounded-full border border-[#d9cdd1] bg-white px-4 py-3 text-sm font-bold text-[#5f5059] transition hover:border-[#b45370] hover:text-[#8d2444]"
              >
                {child.name} →
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10">
        <CatalogBrowser categoryId={category.id} />
      </div>
    </Container>
  );
}
