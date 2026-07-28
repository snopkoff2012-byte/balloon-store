export type DeliveryZoneType =
  | "pickup"
  | "moscow_district"
  | "region_city"
  | "individual";

export type DeliveryPricingMode = "fixed" | "manual";

export type DeliveryZone = {
  id: string;
  name: string;
  slug: string;
  description: string;
  zoneType: DeliveryZoneType;
  matchTerms: string[];
  pricingMode: DeliveryPricingMode;
  basePriceKopecks: number;
  pricePerKmKopecks: number;
  freeFromKopecks: number | null;
  minimumOrderKopecks: number;
  urgentDeliveryAvailable: boolean;
  urgentSurchargeKopecks: number;
  deliveryIntervals: string[];
  requiresManagerConfirmation: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryEstimate = {
  deliveryKopecks: number | null;
  totalKopecks: number | null;
  deliveryIsFree: boolean;
  pricePending: boolean;
  requiresManagerConfirmation: boolean;
};
