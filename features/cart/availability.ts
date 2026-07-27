import type { Product, ProductVariant } from "@/features/catalog/types";
import type { CartItem } from "./types";

export type CartItemAvailability = {
  available: boolean;
  reason: string | null;
  maxQuantity: number | null;
  variant: ProductVariant | null;
};

function equalOptionValues(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    [...first].sort().every((value, index) => value === [...second].sort()[index])
  );
}

export function findSelectedVariant(product: Product, item: CartItem) {
  const selectedValueIds = Object.values(item.selectedOptions);
  return (
    product.variants.find((variant) =>
      equalOptionValues(variant.optionValueIds, selectedValueIds),
    ) ?? null
  );
}

export function getCartItemAvailability(
  product: Product | undefined,
  item: CartItem,
): CartItemAvailability {
  if (!product || product.publicationStatus !== "published") {
    return {
      available: false,
      reason: "Товар скрыт или снят с публикации.",
      maxQuantity: 0,
      variant: null,
    };
  }

  if (product.availabilityStatus === "out_of_stock") {
    return {
      available: false,
      reason: "Товара больше нет в наличии.",
      maxQuantity: 0,
      variant: null,
    };
  }

  const variant = findSelectedVariant(product, item);
  if (product.variants.length > 0 && !variant) {
    return {
      available: false,
      reason: "Выбранный вариант больше недоступен.",
      maxQuantity: 0,
      variant: null,
    };
  }

  if (variant && (!variant.active || variant.availabilityStatus === "out_of_stock")) {
    return {
      available: false,
      reason: "Выбранный вариант больше недоступен.",
      maxQuantity: 0,
      variant,
    };
  }

  const maxQuantity = variant?.stockQuantity ?? product.stockQuantity;
  if (maxQuantity !== null && maxQuantity <= 0) {
    return {
      available: false,
      reason: "Товара больше нет в наличии.",
      maxQuantity: 0,
      variant,
    };
  }

  return {
    available: true,
    reason: null,
    maxQuantity,
    variant,
  };
}
