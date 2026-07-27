import { FREE_DELIVERY_FROM_KOPECKS, STANDARD_DELIVERY_KOPECKS } from "@/features/cart/pricing";

export const URGENT_DELIVERY_SURCHARGE_KOPECKS = 50_000;

export const deliverySlots = [
  { value: "10:00–13:00", label: "10:00–13:00", startHour: 10 },
  { value: "13:00–16:00", label: "13:00–16:00", startHour: 13 },
  { value: "16:00–19:00", label: "16:00–19:00", startHour: 16 },
  { value: "19:00–22:00", label: "19:00–22:00", startHour: 19 },
] as const;

export type FulfillmentMethod = "delivery" | "pickup";

function moscowDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

export function getEarliestDeliveryDate(now = new Date()) {
  return moscowDateParts(now).date;
}

export function getAvailableDeliverySlots(date: string, now = new Date()) {
  const moscow = moscowDateParts(now);
  if (date < moscow.date) return [];
  if (date > moscow.date) return [...deliverySlots];

  // На доставку в тот же день нужно минимум два часа на сборку композиции.
  return deliverySlots.filter((slot) => slot.startHour >= moscow.hour + 2);
}

export function isAvailableDeliverySlot(date: string, slot: string, now = new Date()) {
  return getAvailableDeliverySlots(date, now).some((candidate) => candidate.value === slot);
}

export function calculateDeliveryEstimate({
  itemsTotalKopecks,
  fulfillmentMethod,
  urgentDelivery,
}: {
  itemsTotalKopecks: number;
  fulfillmentMethod: FulfillmentMethod;
  urgentDelivery: boolean;
}) {
  if (fulfillmentMethod === "pickup") {
    return { deliveryKopecks: 0, deliveryIsFree: true };
  }

  const deliveryIsFree = itemsTotalKopecks >= FREE_DELIVERY_FROM_KOPECKS;
  return {
    deliveryKopecks:
      (deliveryIsFree ? 0 : STANDARD_DELIVERY_KOPECKS) +
      (urgentDelivery ? URGENT_DELIVERY_SURCHARGE_KOPECKS : 0),
    deliveryIsFree,
  };
}
