"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { CatalogSkeleton } from "./catalog-skeleton";
import {
  getCategoryAndDescendantIds,
  getPublishedCategories,
  getPublishedProducts,
} from "@/features/catalog/selectors";
import { useCatalogStore } from "@/features/catalog/store";
import {
  getProductAttribute,
  getProductPrice,
  type Product,
} from "@/features/catalog/types";
import { useHydrated } from "@/lib/use-hydrated";

type CatalogBrowserProps = {
  categoryId?: string;
};

type SortValue =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "name";

const INITIAL_LIMIT = 9;

export function CatalogBrowser({ categoryId }: CatalogBrowserProps) {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [availability, setAvailability] = useState("");
  const [badge, setBadge] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sort, setSort] = useState<SortValue>("recommended");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);

  const publishedCategories = useMemo(
    () => getPublishedCategories(categories),
    [categories],
  );
  const publishedProducts = useMemo(
    () => getPublishedProducts(products),
    [products],
  );

  const materials = useMemo(
    () =>
      Array.from(
        new Set(
          publishedProducts.flatMap((product) => {
            const value = getProductAttribute(product, "material")?.value;
            return typeof value === "string" ? [value] : [];
          }),
        ),
      ).sort(),
    [publishedProducts],
  );

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          publishedProducts.flatMap((product) => {
            const value = getProductAttribute(product, "colors")?.value;
            return Array.isArray(value) ? value : [];
          }),
        ),
      ).sort(),
    [publishedProducts],
  );

  const filteredProducts = useMemo(() => {
    const activeCategoryId = categoryId ?? selectedCategoryId;
    const categoryIds = activeCategoryId
      ? getCategoryAndDescendantIds(categories, activeCategoryId)
      : null;
    const normalizedSearch = search.trim().toLocaleLowerCase("ru");

    const result = publishedProducts.filter((product) => {
      if (
        categoryIds &&
        !product.categoryIds.some((productCategoryId) =>
          categoryIds.has(productCategoryId),
        )
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        ![
          product.name,
          product.sku,
          product.shortDescription,
          product.fullDescription,
        ]
          .join(" ")
          .toLocaleLowerCase("ru")
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        availability &&
        product.availabilityStatus !== availability
      ) {
        return false;
      }

      if (
        (badge === "bestseller" && !product.isBestseller) ||
        (badge === "new" && !product.isNew) ||
        (badge === "recommended" && !product.isRecommended) ||
        (badge === "made-to-order" && !product.isMadeToOrder)
      ) {
        return false;
      }

      const productMaterial = getProductAttribute(product, "material")?.value;
      if (material && productMaterial !== material) {
        return false;
      }

      const productColors = getProductAttribute(product, "colors")?.value;
      if (
        color &&
        (!Array.isArray(productColors) || !productColors.includes(color))
      ) {
        return false;
      }

      const price = getProductPrice(product);
      if (
        (priceRange === "under-5000" && price >= 500000) ||
        (priceRange === "5000-8000" &&
          (price < 500000 || price > 800000)) ||
        (priceRange === "over-8000" && price <= 800000)
      ) {
        return false;
      }

      return true;
    });

    return sortProducts(result, sort);
  }, [
    availability,
    badge,
    categories,
    categoryId,
    color,
    material,
    priceRange,
    publishedProducts,
    search,
    selectedCategoryId,
    sort,
  ]);

  const hasFilters = Boolean(
    search ||
      selectedCategoryId ||
      availability ||
      badge ||
      material ||
      color ||
      priceRange,
  );

  function clearFilters() {
    setSearch("");
    setSelectedCategoryId("");
    setAvailability("");
    setBadge("");
    setMaterial("");
    setColor("");
    setPriceRange("");
    setVisibleCount(INITIAL_LIMIT);
  }

  if (!hydrated) {
    return <CatalogSkeleton />;
  }

  return (
    <div className="mt-9">
      <div className="rounded-[1.75rem] border border-[#e5dbd6] bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Поиск по каталогу</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(INITIAL_LIMIT);
              }}
              className="form-input min-h-12 pl-11"
              placeholder="Название, артикул или описание"
            />
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8b93]"
              aria-hidden="true"
            >
              ⌕
            </span>
          </label>
          <label>
            <span className="sr-only">Сортировка</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              className="form-input min-h-12"
            >
              <option value="recommended">Сначала рекомендуемые</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="newest">Сначала новинки</option>
              <option value="name">По названию</option>
            </select>
          </label>
        </div>

        <details className="group mt-3">
          <summary className="flex min-h-11 items-center justify-between rounded-2xl border border-[#e3d8dc] px-4 text-sm font-extrabold text-[#554750] transition hover:border-[#bf97a5]">
            <span>
              Фильтры
              {hasFilters ? (
                <span className="ml-2 rounded-full bg-[#a42a4d] px-2 py-0.5 text-[10px] text-white">
                  активны
                </span>
              ) : null}
            </span>
            <span
              className="text-lg transition group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!categoryId ? (
              <FilterSelect
                label="Категория"
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={publishedCategories.map((category) => ({
                  value: category.id,
                  label: category.parentId ? `— ${category.name}` : category.name,
                }))}
              />
            ) : null}
            <FilterSelect
              label="Наличие"
              value={availability}
              onChange={setAvailability}
              options={[
                { value: "in_stock", label: "В наличии" },
                { value: "limited", label: "Осталось мало" },
                { value: "preorder", label: "Под заказ" },
                { value: "out_of_stock", label: "Нет в наличии" },
              ]}
            />
            <FilterSelect
              label="Отметка"
              value={badge}
              onChange={setBadge}
              options={[
                { value: "bestseller", label: "Хиты" },
                { value: "new", label: "Новинки" },
                { value: "recommended", label: "Рекомендуем" },
                { value: "made-to-order", label: "Под заказ" },
              ]}
            />
            <FilterSelect
              label="Цена"
              value={priceRange}
              onChange={setPriceRange}
              options={[
                { value: "under-5000", label: "До 5 000 ₽" },
                { value: "5000-8000", label: "5 000–8 000 ₽" },
                { value: "over-8000", label: "Более 8 000 ₽" },
              ]}
            />
            <FilterSelect
              label="Материал"
              value={material}
              onChange={setMaterial}
              options={materials.map((item) => ({
                value: item,
                label: item,
              }))}
            />
            <FilterSelect
              label="Цвет"
              value={color}
              onChange={setColor}
              options={colors.map((item) => ({ value: item, label: item }))}
            />
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-extrabold text-[#8d2444] hover:text-[#651a33]"
            >
              Сбросить фильтры
            </button>
          ) : null}
        </details>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#74666f]" aria-live="polite">
          Найдено: {filteredProducts.length}
        </p>
        <p className="hidden text-xs text-[#998b92] sm:block">
          Цены пересчитываются после выбора вариантов
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.slice(0, visibleCount).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {visibleCount < filteredProducts.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + INITIAL_LIMIT)}
              className="button-secondary mx-auto mt-8 flex w-full sm:w-auto"
            >
              Показать ещё
              <span aria-hidden="true">↓</span>
            </button>
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#d8c7cd] bg-white p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl text-[#342831]">
            Ничего не найдено
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#7d6f77]">
            Попробуйте изменить запрос или сбросить часть фильтров.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="button-primary mt-6"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-[#756770]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-input min-h-11 py-2.5 text-sm"
      >
        <option value="">Все</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function sortProducts(products: Product[], sort: SortValue) {
  return [...products].sort((first, second) => {
    switch (sort) {
      case "price-asc":
        return getProductPrice(first) - getProductPrice(second);
      case "price-desc":
        return getProductPrice(second) - getProductPrice(first);
      case "newest":
        return (
          Number(second.isNew) - Number(first.isNew) ||
          Date.parse(second.createdAt) - Date.parse(first.createdAt)
        );
      case "name":
        return first.name.localeCompare(second.name, "ru");
      default: {
        const firstScore =
          Number(first.isRecommended) * 3 +
          Number(first.isBestseller) * 2 +
          Number(first.isNew);
        const secondScore =
          Number(second.isRecommended) * 3 +
          Number(second.isBestseller) * 2 +
          Number(second.isNew);
        return secondScore - firstScore || first.sortOrder - second.sortOrder;
      }
    }
  });
}
