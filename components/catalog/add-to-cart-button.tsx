"use client";

import { useState } from "react";
import type { Product } from "@/data/catalog";
import { useCartStore } from "@/features/cart/store";

type AddToCartButtonProps = {
  product: Product;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  function handleAdd() {
    addItem({
      productId: product.id,
      variantId: product.id,
      quantity: 1,
      selectedOptions: {},
    });
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!product.inStock}
      className="w-full rounded-2xl bg-rose-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {isAdded ? "Добавлено в корзину" : "Добавить в корзину"}
    </button>
  );
}
