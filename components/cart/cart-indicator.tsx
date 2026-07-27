"use client";

import Link from "next/link";
import { useCartStore } from "@/features/cart/store";
import { useHydrated } from "@/lib/use-hydrated";

export function CartIndicator() {
  const isMounted = useHydrated();
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  return (
    <Link
      href="/cart"
      className="relative inline-flex size-11 items-center justify-center rounded-full border border-rose-200 bg-white text-lg transition hover:border-rose-300 hover:bg-rose-50"
      aria-label={`Корзина, товаров: ${isMounted ? itemCount : 0}`}
    >
      <span aria-hidden="true">🛍️</span>
      {isMounted && itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-5 text-white">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
