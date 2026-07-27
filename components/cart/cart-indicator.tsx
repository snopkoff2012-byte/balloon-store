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
      className="relative inline-flex size-11 items-center justify-center rounded-full border border-[#ddd1d6] bg-white text-[#4a3943] transition hover:border-[#b88c9c] hover:bg-[#f9eff1] active:scale-95"
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
    </Link>
  );
}
