"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAdminData } from "@/features/admin/data/admin-data-provider";
import { useCatalogStore } from "@/features/catalog/store";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";

const quickLinks = [
  {
    href: "/admin/orders",
    title: "Обработать заказы",
    text: "Контакты, состав, доставка, оплата и статусы.",
  },
  {
    href: "/admin/products",
    title: "Управлять товарами",
    text: "Цены, остатки, фотографии, варианты и публикация.",
  },
  {
    href: "/admin/categories",
    title: "Настроить категории",
    text: "Разделы каталога, подкатегории и порядок показа.",
  },
  {
    href: "/admin/settings",
    title: "Изменить сайт",
    text: "Контакты, режим работы и тексты главной страницы.",
  },
];

export function AdminDashboard() {
  const hydrated = useHydrated();
  const products = useCatalogStore((state) => state.products);
  const { orders, isLoading } = useAdminData();

  const stats = useMemo(() => {
    const completedSales = orders
      .filter(
        (order) =>
          order.status === "completed" || order.paymentStatus === "paid",
      )
      .reduce((sum, order) => sum + (order.totalKopecks ?? 0), 0);
    return [
      { label: "Всего заказов", value: String(orders.length) },
      {
        label: "Новые заказы",
        value: String(orders.filter((order) => order.status === "new").length),
      },
      {
        label: "Сумма продаж",
        value: formatMoney({ amountKopecks: completedSales, currency: "RUB" }),
      },
      {
        label: "Нет в наличии",
        value: String(
          products.filter(
            (product) =>
              product.availabilityStatus === "out_of_stock" ||
              product.stockQuantity === 0,
          ).length,
        ),
      },
    ];
  }, [orders, products]);

  const popularProducts = useMemo(() => {
    const counters = new Map<string, number>();
    orders.forEach((order) =>
      order.items.forEach((item) =>
        counters.set(
          item.productName,
          (counters.get(item.productName) ?? 0) + item.quantity,
        ),
      ),
    );
    return [...counters.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5);
  }, [orders]);

  const outOfStock = products
    .filter(
      (product) =>
        product.availabilityStatus === "out_of_stock" ||
        product.stockQuantity === 0,
    )
    .slice(0, 5);

  if (!hydrated || isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
          Сегодня в магазине
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Главная панель
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Заказы, продажи и состояние каталога собраны в одном месте.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Популярные товары</h2>
            <Link href="/admin/products" className="admin-link">
              Все товары
            </Link>
          </div>
          {popularProducts.length ? (
            <ol className="mt-5 grid gap-3">
              {popularProducts.map(([name, quantity], index) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="font-bold">
                    {index + 1}. {name}
                  </span>
                  <span className="text-sm text-slate-500">{quantity} шт.</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyLine text="Продажи появятся после первых заказов." />
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Требуют внимания</h2>
            <Link href="/admin/products" className="admin-link">
              Открыть каталог
            </Link>
          </div>
          {outOfStock.length ? (
            <ul className="mt-5 grid gap-3">
              {outOfStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3"
                >
                  <span className="font-bold text-rose-950">{product.name}</span>
                  <span className="text-sm font-semibold text-rose-700">
                    Нет в наличии
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine text="Все опубликованные товары доступны." />
          )}
        </section>
      </div>

      <section className="mt-7">
        <h2 className="text-xl font-black">Быстрые действия</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-sm"
            >
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
      {text}
    </p>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div aria-label="Загрузка главной панели" className="animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-slate-200" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-3xl bg-white" />
        ))}
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="h-64 rounded-3xl bg-white" />
        <div className="h-64 rounded-3xl bg-white" />
      </div>
    </div>
  );
}
