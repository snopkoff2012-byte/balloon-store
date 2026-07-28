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

function intervalStartHour(interval: string) {
  const match = interval.match(/^([01]\d|2[0-3]):[0-5]\d/);
  return match ? Number(match[1]) : null;
}

export function getAvailableDeliverySlots(
  date: string,
  intervals: string[],
  now = new Date(),
) {
  const moscow = moscowDateParts(now);
  if (date < moscow.date) return [];
  const slots = intervals.map((interval) => ({
    value: interval,
    label: interval,
    startHour: intervalStartHour(interval),
  }));
  if (date > moscow.date) return slots;

  // На доставку в тот же день нужно минимум два часа на сборку композиции.
  return slots.filter(
    (slot) => slot.startHour !== null && slot.startHour >= moscow.hour + 2,
  );
}

export function isAvailableDeliverySlot(
  date: string,
  slot: string,
  intervals: string[],
  now = new Date(),
) {
  return getAvailableDeliverySlots(date, intervals, now).some(
    (candidate) => candidate.value === slot,
  );
}
