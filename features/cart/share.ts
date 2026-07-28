import { formatMoney } from "@/lib/money";
import { getCartTotals } from "./pricing";
import type { CartItem } from "./types";

export function createCartMessage(items: CartItem[], cartUrl: string, customerComment = "") {
  const totals = getCartTotals(items);
  const lines = items.flatMap((item, index) => [
    `${index + 1}. ${item.productName}`,
    ...(item.selectedOptionLabels.length ? [`   ${item.selectedOptionLabels.join(", ")}`] : []),
    `   ${item.quantity} шт. × ${formatMoney({ amountKopecks: item.unitPriceKopecks, currency: "RUB" })}`,
  ]);

  return [
    "Здравствуйте! Хочу уточнить заказ:",
    "",
    ...lines,
    "",
    `Промежуточная сумма: ${formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })}`,
    "Доставка: рассчитать после выбора зоны",
    `Итог: ${formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })} (без доставки)`,
    ...(customerComment.trim() ? ["", `Комментарий: ${customerComment.trim()}`] : []),
    "",
    `Корзина: ${cartUrl}`,
  ].join("\n");
}

export const createCartMessageWithComment = createCartMessage;
