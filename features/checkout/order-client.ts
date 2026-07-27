"use client";

import type { CartItem } from "@/features/cart/types";
import { createOrderSchema, orderResultSchema, type OrderResult } from "./order-schema";

type CustomerDetails = {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  date: string;
  interval: string;
  comment?: string;
};

export async function createOrder(
  customer: CustomerDetails,
  items: CartItem[],
  idempotencyKey: string,
): Promise<OrderResult> {
  const payload = createOrderSchema.parse({
    ...customer,
    email: customer.email ?? "",
    comment: customer.comment ?? "",
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
