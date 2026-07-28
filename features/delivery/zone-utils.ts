import type {
  DeliveryEstimate,
  DeliveryZone,
  DeliveryZoneType,
} from "./types";

export const deliveryZoneTypeLabels: Record<DeliveryZoneType, string> = {
  pickup: "Самовывоз",
  moscow_district: "Москва внутри МКАД",
  region_city: "Города Московской области",
  individual: "Индивидуальный расчёт",
};

export function normalizeDeliveryLocation(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/\b(город|г|городской округ)\b\.?/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function findDeliveryZoneForCity(
  city: string,
  zones: DeliveryZone[],
) {
  const normalizedCity = normalizeDeliveryLocation(city);
  if (!normalizedCity) return null;

  const cityZone = zones.find((zone) => {
    if (zone.zoneType !== "region_city") return false;
    const terms = [zone.name, ...zone.matchTerms].map(normalizeDeliveryLocation);
    return terms.includes(normalizedCity);
  });
  if (cityZone) return cityZone;

  if (normalizedCity === "москва") return null;
  return zones.find((zone) => zone.zoneType === "individual") ?? null;
}

export function calculateDeliveryEstimate({
  zone,
  itemsTotalKopecks,
  urgentDelivery,
}: {
  zone: DeliveryZone | null;
  itemsTotalKopecks: number;
  urgentDelivery: boolean;
}): DeliveryEstimate {
  if (!zone) {
    return {
      deliveryKopecks: null,
      totalKopecks: null,
      deliveryIsFree: false,
      pricePending: true,
      requiresManagerConfirmation: true,
    };
  }

  if (zone.pricingMode === "manual") {
    return {
      deliveryKopecks: null,
      totalKopecks: null,
      deliveryIsFree: false,
      pricePending: true,
      requiresManagerConfirmation: true,
    };
  }

  const deliveryIsFree =
    zone.zoneType === "pickup" ||
    (zone.freeFromKopecks !== null &&
      itemsTotalKopecks >= zone.freeFromKopecks);
  const deliveryKopecks =
    (deliveryIsFree ? 0 : zone.basePriceKopecks) +
    (urgentDelivery && zone.urgentDeliveryAvailable
      ? zone.urgentSurchargeKopecks
      : 0);

  return {
    deliveryKopecks,
    totalKopecks: itemsTotalKopecks + deliveryKopecks,
    deliveryIsFree,
    pricePending: false,
    requiresManagerConfirmation: zone.requiresManagerConfirmation,
  };
}
