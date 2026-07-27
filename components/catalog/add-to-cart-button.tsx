"use client";

import { useState } from "react";
import { useCartStore } from "@/features/cart/store";
import type { Product } from "@/features/catalog/types";

type AddToCartButtonProps = {
  product: Product;
  unitPriceKopecks: number;
  selectedOptions: Record<string, string>;
  selectedOptionLabels: string[];
  disabled?: boolean;
};

export function AddToCartButton({
  product,
  unitPriceKopecks,
  selectedOptions,
  selectedOptionLabels,
  disabled = false,
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  function handleAdd() {
    const optionKey = Object.values(selectedOptions).sort().join("-");
    addItem({
      productId: product.id,
      variantId: optionKey ? `${product.id}-${optionKey}` : product.id,
      quantity: 1,
      selectedOptions,
      selectedOptionLabels,
      unitPriceKopecks,
      productName: product.name,
      productSlug: product.slug,
    });
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className="button-primary w-full rounded-2xl disabled:cursor-not-allowed disabled:border-[#cfc5c9] disabled:bg-[#cfc5c9] disabled:shadow-none"
    >
      {disabled
        ? "Сейчас недоступно"
        : isAdded
          ? "Добавлено в корзину"
          : "Добавить в корзину"}
    </button>
  );
}
