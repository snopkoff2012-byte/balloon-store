import type { CartItem, CartTotals } from "./types";

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
  return {
    itemsTotalKopecks,
    discountKopecks,
  };
}
