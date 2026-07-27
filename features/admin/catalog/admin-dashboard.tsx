"use client";

import Link from "next/link";
import { useCatalogStore } from "@/features/catalog/store";
import { useHydrated } from "@/lib/use-hydrated";

export function AdminDashboard() {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const source = useCatalogStore((state) => state.source);
  const resetCatalog = useCatalogStore((state) => state.resetCatalog);

  const stats = [
    { label: "Товаров", value: hydrated ? products.length : "—" },
    { label: "Категорий", value: hydrated ? categories.length : "—" },
    {
      label: "Скрыто",
      value: hydrated
        ? products.filter((product) => product.publicationStatus !== "published")
            .length
        : "—",
    },
  ];

  async function handleReset() {
    if (
      window.confirm(
        "Сбросить все локальные изменения и вернуть исходные 20 товаров?",
      )
    ) {
      await resetCatalog();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
            Демонстрационный режим
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Управление каталогом
          </h1>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
          Данные сохраняются на этом устройстве
        </span>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Разделы управления</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/categories"
            className="rounded-2xl border border-slate-200 p-5 transition hover:border-rose-300 hover:bg-rose-50"
          >
            <span className="text-lg font-bold text-slate-950">
              Категории и подкатегории
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Добавление, иерархия, SEO, порядок и публикация
            </span>
          </Link>
          <Link
            href="/admin/products"
            className="rounded-2xl border border-slate-200 p-5 transition hover:border-rose-300 hover:bg-rose-50"
          >
            <span className="text-lg font-bold text-slate-950">
              Товары, варианты и фото
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Цены, остатки, характеристики и универсальные опции
            </span>
          </Link>
        </div>
        {source === "fallback" ? (
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-rose-400 hover:text-rose-700"
          >
            Вернуть исходные тестовые данные
          </button>
        ) : null}
      </section>
    </>
  );
}
