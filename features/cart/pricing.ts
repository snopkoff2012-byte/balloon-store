import type { CartItem, CartTotals } from "./types";

export const STANDARD_DELIVERY_KOPECKS = 69_000;
export const FREE_DELIVERY_FROM_KOPECKS = 700_000;

export function getCartTotals(items: CartItem[]): CartTotals {
  const itemsTotalKopecks = items.reduce(
    (total, item) => total + item.unitPriceKopecks * item.quantity,
    0,
  );
  const discountKopecks = items.reduce(
    (total, item) =>
      total +
      Math.max(0, item.regularUnitPriceKopecks - item.unitPriceKopecks) *
        item.quantity,
    0,
  );
  const deliveryIsFree = itemsTotalKopecks >= FREE_DELIVERY_FROM_KOPECKS;
  const deliveryKopecks = items.length
    ? deliveryIsFree
      ? 0
      : STANDARD_DELIVERY_KOPECKS
    : 0;

  return {
    itemsTotalKopecks,
    discountKopecks,
    deliveryKopecks,
    totalKopecks: itemsTotalKopecks + deliveryKopecks,
    deliveryIsFree,
  };
}
