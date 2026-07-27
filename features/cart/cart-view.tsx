"use client";

import Link from "next/link";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { useCatalogStore } from "@/features/catalog/store";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { getCartItemAvailability } from "./availability";
import { getCartTotals } from "./pricing";
import { createCartMessage, createTelegramShareUrl, createWhatsAppShareUrl } from "./share";
import { useCartStore } from "./store";

export function CartView() {
  const isMounted = useHydrated();
  const products = useCatalogStore((state) => state.products);
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

  if (items.length === 0) {
    return <EmptyCart />;
  }

  const totals = getCartTotals(items);
  const lineStates = items.map((item) => ({
    item,
    product: products.find((product) => product.id === item.productId),
  }));
  const hasUnavailableItems = lineStates.some(({ item, product }) =>
    !getCartItemAvailability(product, item).available,
  );
  const cartUrl = `${window.location.origin}/cart`;
  const message = createCartMessage(items, cartUrl);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4">
        {lineStates.map(({ item, product }) => {
          const availability = getCartItemAvailability(product, item);
          const cannotIncrease =
            !availability.available ||
            (availability.maxQuantity !== null && item.quantity >= availability.maxQuantity);

          return (
            <article
              key={item.variantId}
              className="flex flex-col gap-5 rounded-[1.75rem] border border-[#e5dbd6] bg-white p-5 sm:flex-row sm:items-center"
            >
              <BalloonPhotoPlaceholder
                variant="product"
                compact
                className="size-28 shrink-0 rounded-2xl"
                label={`Фотография товара «${item.productName}»`}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${item.productSlug}`}
                  className="text-lg font-extrabold text-[#342831] hover:text-[#8d2444]"
                >
                  {item.productName}
                </Link>
                <p className="mt-1 text-sm text-[#82747c]">
                  {formatMoney({ amountKopecks: item.unitPriceKopecks, currency: "RUB" })} за набор
                </p>
                {item.selectedOptionLabels.length > 0 ? (
                  <ul className="mt-2 text-xs leading-5 text-[#82747c]">
                    {item.selectedOptionLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : null}
                {!availability.available ? (
                  <p className="mt-2 text-xs font-bold text-[#a53a42]">
                    {availability.reason} Удалите позицию перед оформлением.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-[#ddd1d6]">
                    <button
                      type="button"
                      className="size-9 text-lg transition hover:text-[#a42a4d] active:scale-90"
                      aria-label={`Уменьшить количество ${item.productName}`}
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      className="size-9 text-lg transition hover:text-[#a42a4d] active:scale-90 disabled:cursor-not-allowed disabled:text-[#c5b8be]"
                      aria-label={`Увеличить количество ${item.productName}`}
                      disabled={cannotIncrease}
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  {availability.maxQuantity !== null ? (
                    <span className="text-xs text-[#887a82]">Доступно: {availability.maxQuantity} шт.</span>
                  ) : null}
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
                {formatMoney({ amountKopecks: item.unitPriceKopecks * item.quantity, currency: "RUB" })}
              </p>
            </article>
          );
        })}
      </div>

      <aside className="h-fit rounded-[1.75rem] bg-[#342631] p-6 text-white lg:sticky lg:top-28">
        <h2 className="text-xl font-extrabold">Ваш заказ</h2>
        <SummaryRow label="Товары" value={formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })} />
        <SummaryRow
          label="Скидка"
          value={totals.discountKopecks ? `−${formatMoney({ amountKopecks: totals.discountKopecks, currency: "RUB" })}` : "0 ₽"}
          accent={totals.discountKopecks > 0}
        />
        <SummaryRow
          label="Доставка"
          value={totals.deliveryIsFree ? "Бесплатно" : formatMoney({ amountKopecks: totals.deliveryKopecks, currency: "RUB" })}
        />
        <p className="mt-2 text-xs leading-5 text-white/50">
          Точную стоимость и время подтвердит менеджер. От {formatMoney({ amountKopecks: 700_000, currency: "RUB" })} доставка бесплатна.
        </p>
        <div className="mt-6 flex items-end justify-between border-t border-white/15 pt-5">
          <span className="font-semibold">Итого</span>
          <span className="text-2xl font-bold">
            {formatMoney({ amountKopecks: totals.totalKopecks, currency: "RUB" })}
          </span>
        </div>
        {hasUnavailableItems ? (
          <p className="mt-5 rounded-2xl bg-[#6d2538] px-4 py-3 text-sm font-semibold leading-5 text-white">
            В корзине есть недоступные товары. Удалите их, чтобы продолжить.
          </p>
        ) : (
          <Link href="/checkout" className="button-light mt-6 flex rounded-2xl">
            Перейти к оформлению
          </Link>
        )}
        <div className="mt-4 grid gap-2">
          <a
            href={createTelegramShareUrl(message, cartUrl)}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            Отправить корзину в Telegram
          </a>
          <a
            href={createWhatsAppShareUrl(message)}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            Отправить корзину в WhatsApp
          </a>
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mt-3 flex justify-between gap-4 text-sm text-white/62">
      <span>{label}</span>
      <span className={accent ? "font-bold text-[#f4c2a9]" : undefined}>{value}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d9c7cd] bg-white p-10 text-center">
      <span className="mx-auto block h-12 w-12 rounded-full border-[10px] border-[#ead9df]" aria-hidden="true" />
      <h2 className="mt-5 font-display text-2xl text-[#342831]">Корзина пока пуста</h2>
      <p className="mx-auto mt-3 max-w-md text-[#776a72]">
        Добавьте понравившуюся композицию — выбранные параметры сохранятся после перезагрузки страницы.
      </p>
      <Link href="/catalog" className="button-primary mt-6">Перейти в каталог</Link>
    </div>
  );
}
