import { z } from "zod";
import { getEarliestDeliveryDate, isAvailableDeliverySlot } from "./delivery";

const cartLineSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  selectedOptions: z.record(z.uuid(), z.uuid()),
});

const phoneSchema = z
  .string()
  .refine(
    (value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 11 && digits.startsWith("7");
    },
    "Укажите телефон в формате +7",
  );

export const checkoutDetailsSchema = z
  .object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  contactMethod: z.enum(["telegram", "whatsapp"]),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  recipientIsDifferent: z.boolean(),
  recipientName: z.string().trim().max(120),
  recipientPhone: z.union([z.literal(""), phoneSchema]),
  comment: z.string().trim().max(500),
  cardEnabled: z.boolean(),
  cardText: z.string().trim().max(300),
  fulfillmentMethod: z.enum(["delivery", "pickup"]),
  city: z.string().trim().max(120),
  address: z.string().trim().max(500),
  apartmentOffice: z.string().trim().max(80),
  entrance: z.string().trim().max(30),
  floor: z.string().trim().max(30),
  intercom: z.string().trim().max(80),
  date: z.string().date(),
  interval: z.string().trim().max(80),
  urgentDelivery: z.boolean(),
  paymentMethod: z.enum(["on_confirmation", "cash", "card_to_courier", "online"]),
  consent: z.boolean().refine((value) => value, "Необходимо согласие"),
  website: z.literal(""),
  submittedAt: z.number().int().positive(),
})
  .superRefine((data, context) => {
    if (data.recipientIsDifferent && data.recipientName.length < 2) {
      context.addIssue({ code: "custom", path: ["recipientName"], message: "Укажите имя получателя" });
    }
    if (data.recipientIsDifferent && !data.recipientPhone) {
      context.addIssue({ code: "custom", path: ["recipientPhone"], message: "Укажите телефон получателя" });
    }
    if (data.cardEnabled && !data.cardText) {
      context.addIssue({ code: "custom", path: ["cardText"], message: "Напишите текст для открытки" });
    }
    if (data.fulfillmentMethod === "delivery") {
      if (data.city.length < 2) context.addIssue({ code: "custom", path: ["city"], message: "Укажите город" });
      if (data.address.length < 5) context.addIssue({ code: "custom", path: ["address"], message: "Укажите адрес" });
    }
    if (data.date < getEarliestDeliveryDate()) {
      context.addIssue({ code: "custom", path: ["date"], message: "Нельзя выбрать прошедшую дату" });
    }
    if (!isAvailableDeliverySlot(data.date, data.interval)) {
      context.addIssue({ code: "custom", path: ["interval"], message: "Этот интервал уже недоступен" });
    }
    const age = Date.now() - data.submittedAt;
    if (age < 800 || age > 3_600_000) {
      context.addIssue({ code: "custom", path: ["submittedAt"], message: "Подтвердите форму ещё раз" });
    }
  });

export const createOrderSchema = checkoutDetailsSchema.extend({
  idempotencyKey: z.uuid(),
  items: z.array(cartLineSchema).min(1).max(30),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

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
