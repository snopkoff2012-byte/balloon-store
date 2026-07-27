import { z } from "zod";

const cartLineSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  selectedOptions: z.record(z.uuid(), z.uuid()),
});

export const createOrderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(40),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  city: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(500),
  date: z.string().date(),
  interval: z.string().trim().min(1).max(80),
  comment: z.string().trim().max(500),
  idempotencyKey: z.uuid(),
  items: z.array(cartLineSchema).min(1).max(30),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderResultSchema = z.object({
  order_id: z.uuid(),
  order_number: z.coerce.number().int(),
  public_token: z.uuid(),
  items_total_kopecks: z.coerce.number().int().nonnegative(),
  discount_kopecks: z.coerce.number().int().nonnegative(),
  delivery_kopecks: z.coerce.number().int().nonnegative(),
  total_kopecks: z.coerce.number().int().nonnegative(),
});

export type OrderResult = z.infer<typeof orderResultSchema>;
