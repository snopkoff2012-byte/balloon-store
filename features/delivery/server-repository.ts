import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { getOptionalPublicEnvironment } from "@/lib/environment";
import { withSupabaseRequestTimeout } from "@/lib/supabase/request-timeout";
import type {
  DeliveryPricingMode,
  DeliveryZone,
  DeliveryZoneType,
} from "./types";

type DeliveryZonesResult = {
  zones: DeliveryZone[];
  unavailable: boolean;
};

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: unknown) {
  return value === null || value === undefined ? null : numberValue(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : [];
}

function mapDeliveryZone(row: Record<string, unknown>): DeliveryZone {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    zoneType: String(row.zone_type) as DeliveryZoneType,
    matchTerms: stringArray(row.match_terms),
    pricingMode: String(row.pricing_mode) as DeliveryPricingMode,
    basePriceKopecks: numberValue(row.base_price_kopecks),
    pricePerKmKopecks: numberValue(row.price_per_km_kopecks),
    freeFromKopecks: nullableNumber(row.free_from_kopecks),
    minimumOrderKopecks: numberValue(row.minimum_order_kopecks),
    urgentDeliveryAvailable: Boolean(row.urgent_delivery_available),
    urgentSurchargeKopecks: numberValue(row.urgent_surcharge_kopecks),
    deliveryIntervals: stringArray(row.delivery_intervals),
    requiresManagerConfirmation: Boolean(
      row.requires_manager_confirmation,
    ),
    isActive: Boolean(row.is_active),
    sortOrder: numberValue(row.sort_order),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export const loadPublicDeliveryZones = cache(
  async (): Promise<DeliveryZonesResult> => {
    const environment = getOptionalPublicEnvironment();
    if (!environment) return { zones: [], unavailable: true };

    try {
      const supabase = createClient(
        environment.NEXT_PUBLIC_SUPABASE_URL,
        environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
      );
      const result = await withSupabaseRequestTimeout<{
        data: Array<Record<string, unknown>>;
        error: { message: string } | null;
      }>(async (signal) => {
        const response = await supabase
          .from("delivery_zones")
          .select("*")
          .eq("is_active", true)
          .order("sort_order")
          .abortSignal(signal);
        return {
          data: (response.data ?? []) as Array<Record<string, unknown>>,
          error: response.error,
        };
      });
      if (result.error) throw new Error(result.error.message);

      return {
        zones: result.data.map(mapDeliveryZone),
        unavailable: false,
      };
    } catch (error) {
      console.warn("Public delivery zones could not be loaded:", error);
      return { zones: [], unavailable: true };
    }
  },
);
