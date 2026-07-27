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
      className="button-primary w-full rounded-2xl disabled:cursor-not-allowed disabled:border-[#cfc5c9] disabled:bg-[#cfc5c9] disabled:shadow-none"
    >
      {isAdded ? "Добавлено в корзину" : "Добавить в корзину"}
    </button>
  );
}
