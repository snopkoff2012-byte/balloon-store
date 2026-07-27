"use client";

import Link from "next/link";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
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
      <div className="rounded-[1.75rem] border border-[#e5dbd6] bg-white p-8 text-[#82747c]">
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
      <div className="rounded-[1.75rem] border border-dashed border-[#d9c7cd] bg-white p-10 text-center">
        <span
          className="mx-auto block h-12 w-12 rounded-full border-[10px] border-[#ead9df]"
          aria-hidden="true"
        />
        <h2 className="mt-5 font-display text-2xl text-[#342831]">
          Корзина пока пуста
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[#776a72]">
          Добавьте понравившийся набор из каталога — он сохранится на этом
          устройстве.
        </p>
        <Link
          href="/catalog"
          className="button-primary mt-6"
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
            className="flex flex-col gap-5 rounded-[1.75rem] border border-[#e5dbd6] bg-white p-5 sm:flex-row sm:items-center"
          >
            <BalloonPhotoPlaceholder
              variant="product"
              compact
              className="size-28 shrink-0 rounded-2xl"
              label={`Заглушка фотографии товара «${product.name}»`}
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${product.slug}`}
                className="text-lg font-extrabold text-[#342831] hover:text-[#8d2444]"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-sm text-[#82747c]">
                {formatMoney({
                  amountKopecks: product.priceKopecks,
                  currency: "RUB",
                })}{" "}
                за набор
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-[#ddd1d6]">
                  <button
                    type="button"
                    className="size-9 text-lg transition hover:text-[#a42a4d] active:scale-90"
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
                    className="size-9 text-lg transition hover:text-[#a42a4d] active:scale-90"
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
                  className="text-sm font-bold text-[#82747c] hover:text-[#8d2444]"
                  onClick={() => removeItem(item.variantId)}
                >
                  Удалить
                </button>
              </div>
            </div>
            <p className="text-lg font-extrabold text-[#342831]">
              {formatMoney({
                amountKopecks: product.priceKopecks * item.quantity,
                currency: "RUB",
              })}
            </p>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-[1.75rem] bg-[#342631] p-6 text-white lg:sticky lg:top-28">
        <h2 className="text-xl font-extrabold">Ваш заказ</h2>
        <div className="mt-6 flex justify-between text-sm text-white/62">
          <span>Товары</span>
          <span>
            {formatMoney({ amountKopecks: itemsTotal, currency: "RUB" })}
          </span>
        </div>
        <div className="mt-3 flex justify-between text-sm text-white/62">
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
          className="button-light mt-6 flex rounded-2xl"
        >
          Перейти к оформлению
        </Link>
      </aside>
    </div>
  );
}
