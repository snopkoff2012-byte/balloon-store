"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getCartTotals } from "@/features/cart/pricing";
import { useCartStore } from "@/features/cart/store";
import { useHydrated } from "@/lib/use-hydrated";

export function CartIndicator() {
  const isMounted = useHydrated();
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totals = getCartTotals(items);

  return (
    <details className="group relative">
      <summary
        className="relative flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#ddd1d6] bg-white text-[#4a3943] transition hover:border-[#b88c9c] hover:bg-[#f9eff1] active:scale-95 [&::-webkit-details-marker]:hidden"
        aria-label={`Корзина, товаров: ${isMounted ? itemCount : 0}`}
      >
        <span
          className="relative mt-1 block h-4 w-4 rounded-[3px] border-2 border-current before:absolute before:-top-2 before:left-0.5 before:h-2 before:w-2 before:rounded-t-full before:border-x-2 before:border-t-2 before:border-current"
          aria-hidden="true"
        />
        {isMounted && itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#a42a4d] px-1 text-[11px] font-bold leading-5 text-white">
            {itemCount}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.7rem)] hidden w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#e5dbd6] bg-white p-4 text-left shadow-2xl shadow-[#342631]/15 group-open:block">
        <p className="text-sm font-extrabold text-[#342831]">Мини-корзина</p>
        {!isMounted || items.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#776a72]">
            Добавьте композицию — она сохранится на этом устройстве.
          </p>
        ) : (
          <>
            <ul className="mt-3 grid max-h-52 gap-3 overflow-y-auto pr-1">
              {items.slice(0, 3).map((item) => (
                <li key={item.variantId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[#453740]">
                      {item.productName}
                    </span>
                    <span className="block text-xs text-[#887a82]">{item.quantity} шт.</span>
                  </span>
                  <span className="shrink-0 font-bold text-[#453740]">
                    {formatMoney({
                      amountKopecks: item.unitPriceKopecks * item.quantity,
                      currency: "RUB",
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {items.length > 3 ? (
              <p className="mt-3 text-xs font-semibold text-[#887a82]">
                Ещё позиций: {items.length - 3}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between border-t border-[#eee5e0] pt-4">
              <span className="text-sm font-bold text-[#776a72]">Товары</span>
              <span className="font-extrabold text-[#342831]">
                {formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })}
              </span>
            </div>
          </>
        )}
        <Link href="/cart" className="button-primary mt-4 flex w-full rounded-2xl">
          {items.length ? "Открыть корзину" : "Перейти в каталог"}
        </Link>
      </div>
    </details>
  );
}
