import { formatMoney } from "@/lib/money";
import { getCartTotals } from "./pricing";
import type { CartItem } from "./types";

export function createCartMessage(items: CartItem[], cartUrl: string) {
  const totals = getCartTotals(items);
  const lines = items.flatMap((item, index) => [
    `${index + 1}. ${item.productName}`,
    ...(item.selectedOptionLabels.length > 0
      ? [`   ${item.selectedOptionLabels.join(", ")}`]
      : []),
    `   ${item.quantity} шт. × ${formatMoney({ amountKopecks: item.unitPriceKopecks, currency: "RUB" })}`,
  ]);

  return [
    "Здравствуйте! Хочу уточнить заказ:",
    "",
    ...lines,
    "",
    `Товары: ${formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })}`,
    `Доставка: ${totals.deliveryIsFree ? "бесплатно" : formatMoney({ amountKopecks: totals.deliveryKopecks, currency: "RUB" })}`,
    `Итого: ${formatMoney({ amountKopecks: totals.totalKopecks, currency: "RUB" })}`,
    "",
    `Корзина: ${cartUrl}`,
  ].join("\n");
}

export function createTelegramShareUrl(message: string, cartUrl: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(cartUrl)}&text=${encodeURIComponent(message)}`;
}

export function createWhatsAppShareUrl(message: string) {
  return `https://wa.me/74950000000?text=${encodeURIComponent(message)}`;
}
