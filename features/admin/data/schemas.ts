import { z } from "zod";

export const orderUpdateSchema = z.object({
  status: z.enum([
    "new",
    "confirmed",
    "awaiting_payment",
    "paid",
    "preparing",
    "handed_to_courier",
    "completed",
    "cancelled",
  ]),
  managerComment: z.string().max(2000),
  paymentStatus: z.enum([
    "pending",
    "awaiting",
    "paid",
    "refunded",
    "failed",
  ]),
  paymentMethod: z.string().min(1).max(80),
  deliveryStatus: z.enum([
    "not_scheduled",
    "scheduled",
    "courier_assigned",
    "in_transit",
    "delivered",
    "cancelled",
  ]),
  deliveryZoneId: z.string(),
  requestedDeliveryDate: z.string(),
  requestedDeliverySlot: z.string().max(100),
  deliveryRub: z.union([z.literal(""), z.coerce.number().min(0)]),
  urgentDelivery: z.boolean(),
  deliveryRequiresConfirmation: z.boolean(),
});

export const deliveryZoneFormSchema = z.object({
  name: z.string().min(2, "Укажите название"),
  slug: z
    .string()
    .min(2, "Укажите slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы"),
  description: z.string().max(1000),
  zoneType: z.enum([
    "pickup",
    "moscow_district",
    "region_city",
    "individual",
  ]),
  matchTerms: z.string().max(1000),
  pricingMode: z.enum(["fixed", "manual"]),
  basePriceRub: z.coerce.number().min(0),
  pricePerKmRub: z.coerce.number().min(0),
  freeFromRub: z.union([z.literal(""), z.coerce.number().min(0)]),
  minimumOrderRub: z.coerce.number().min(0),
  urgentDeliveryAvailable: z.boolean(),
  urgentSurchargeRub: z.coerce.number().min(0),
  deliveryIntervals: z.string().min(1, "Укажите хотя бы один интервал"),
  requiresManagerConfirmation: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export const promoCodeFormSchema = z.object({
  code: z
    .string()
    .min(2, "Укажите код")
    .regex(/^[A-Z0-9_-]+$/, "Используйте заглавные латинские буквы и цифры"),
  description: z.string().max(500),
  discountType: z.enum(["fixed", "percent"]),
  discountValueRubOrPercent: z.coerce.number().positive(),
  minimumOrderRub: z.coerce.number().min(0),
  maximumDiscountRub: z.union([z.literal(""), z.coerce.number().min(0)]),
  startsAt: z.string(),
  endsAt: z.string(),
  usageLimit: z.union([z.literal(""), z.coerce.number().int().positive()]),
  perCustomerLimit: z.union([
    z.literal(""),
    z.coerce.number().int().positive(),
  ]),
  isActive: z.boolean(),
});

export const storeSettingsSchema = z.object({
  phone: z.string().min(5, "Укажите телефон"),
  email: z.union([z.literal(""), z.string().email("Проверьте почту")]),
  telegram: z.string(),
  telegramEnabled: z.boolean(),
  whatsapp: z.string(),
  whatsappEnabled: z.boolean(),
  address: z.string(),
  workingHours: z.string().min(3, "Укажите часы работы"),
  minimumOrderRub: z.coerce.number().min(0),
  homeEyebrow: z.string().min(3),
  homeTitle: z.string().min(5),
  homeDescription: z.string().min(10),
});
