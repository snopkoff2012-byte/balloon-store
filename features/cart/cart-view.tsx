"use client";

import Link from "next/link";
import { getProductById } from "@/data/catalog";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { useCartStore } from "./store";

export function CartView() {
  const isMounted = useHydrated();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  if (!isMounted) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
        Загружаем корзину…
      </div>
    );
  }

  const cartLines = items.flatMap((item) => {
    const product = getProductById(item.productId);
    return product ? [{ item, product }] : [];
  });

  if (cartLines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-10 text-center">
        <p className="text-5xl" aria-hidden="true">
          🛍️
        </p>
        <h2 className="mt-5 text-2xl font-bold text-slate-950">
          Корзина пока пуста
        </h2>
        <p className="mx-auto mt-3 max-w-md text-slate-600">
          Добавьте понравившийся набор из каталога — он сохранится на этом
          устройстве.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex rounded-full bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const itemsTotal = cartLines.reduce(
    (total, line) =>
      total + line.product.priceKopecks * line.item.quantity,
    0,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {cartLines.map(({ item, product }) => (
          <article
            key={item.variantId}
            className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
          >
            <div
              className={`flex size-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${product.accent} text-5xl`}
              aria-hidden="true"
            >
              {product.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${product.slug}`}
                className="text-lg font-bold text-slate-950 hover:text-rose-600"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {formatMoney({
                  amountKopecks: product.priceKopecks,
                  currency: "RUB",
                })}{" "}
                за набор
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-slate-200">
                  <button
                    type="button"
                    className="size-9 text-lg"
                    aria-label={`Уменьшить количество ${product.name}`}
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="size-9 text-lg"
                    aria-label={`Увеличить количество ${product.name}`}
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-slate-500 hover:text-rose-600"
                  onClick={() => removeItem(item.variantId)}
                >
                  Удалить
                </button>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-950">
              {formatMoney({
                amountKopecks: product.priceKopecks * item.quantity,
                currency: "RUB",
              })}
            </p>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Ваш заказ</h2>
        <div className="mt-6 flex justify-between text-sm text-slate-300">
          <span>Товары</span>
          <span>
            {formatMoney({ amountKopecks: itemsTotal, currency: "RUB" })}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-sm text-slate-300">
          <span>Доставка</span>
          <span>после подтверждения</span>
        </div>
        <div className="mt-6 flex items-end justify-between border-t border-white/15 pt-5">
          <span className="font-semibold">Итого без доставки</span>
          <span className="text-2xl font-bold">
            {formatMoney({ amountKopecks: itemsTotal, currency: "RUB" })}
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-6 flex justify-center rounded-2xl bg-rose-500 px-5 py-4 font-bold text-white hover:bg-rose-400"
        >
          Перейти к оформлению
        </Link>
      </aside>
    </div>
  );
}
