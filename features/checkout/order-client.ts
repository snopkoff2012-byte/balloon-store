"use client";

import type { CartItem } from "@/features/cart/types";
import { createOrderSchema, orderResultSchema, type CheckoutDetails, type OrderResult } from "./order-schema";

export async function createOrder(
  customer: CheckoutDetails,
  items: CartItem[],
  idempotencyKey: string,
): Promise<OrderResult> {
  const payload = createOrderSchema.parse({
    ...customer,
    idempotencyKey,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
    })),
  });
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : "Не удалось проверить корзину. Попробуйте ещё раз.";
    throw new Error(message);
  }

  return orderResultSchema.parse(body);
}
