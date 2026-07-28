import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import {
  defaultStoreSettings,
  type StoreSettings,
} from "@/features/admin/data/types";
import { getOptionalPublicEnvironment } from "@/lib/environment";
import { withSupabaseRequestTimeout } from "@/lib/supabase/request-timeout";

const publicSettingKeys = [
  "store.contacts",
  "store.working_hours",
  "store.checkout",
  "home.hero",
] as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

export const loadPublicStoreSettings = cache(
  async (): Promise<StoreSettings> => {
    const environment = getOptionalPublicEnvironment();
    if (!environment) return defaultStoreSettings;

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
        data: Array<{ key: string; value: unknown }>;
        error: { message: string } | null;
      }>(async (signal) => {
        const response = await supabase
          .from("site_settings")
          .select("key,value")
          .in("key", publicSettingKeys)
          .abortSignal(signal);
        return {
          data: (response.data ?? []) as Array<{ key: string; value: unknown }>,
          error: response.error,
        };
      });
      if (result.error) throw new Error(result.error.message);

      const rows = new Map<string, Record<string, unknown>>(
        result.data.map((row) => [row.key, asObject(row.value)]),
      );
      const contacts = rows.get("store.contacts") ?? {};
      const hours = rows.get("store.working_hours") ?? {};
      const checkout = rows.get("store.checkout") ?? {};
      const hero = rows.get("home.hero") ?? {};

      return {
        phone: asText(contacts.phone, defaultStoreSettings.phone),
        email: asText(contacts.email, defaultStoreSettings.email),
        telegram: asText(contacts.telegram, defaultStoreSettings.telegram),
        telegramEnabled:
          typeof contacts.telegramEnabled === "boolean"
            ? contacts.telegramEnabled
            : defaultStoreSettings.telegramEnabled,
        whatsapp: asText(contacts.whatsapp, defaultStoreSettings.whatsapp),
        whatsappEnabled:
          typeof contacts.whatsappEnabled === "boolean"
            ? contacts.whatsappEnabled
            : defaultStoreSettings.whatsappEnabled,
        address: asText(contacts.address, defaultStoreSettings.address),
        workingHours: asText(hours.daily, defaultStoreSettings.workingHours),
        minimumOrderRub: asNonNegativeNumber(
          checkout.minimumOrderRub,
          defaultStoreSettings.minimumOrderRub,
        ),
        homeEyebrow: asText(hero.eyebrow, defaultStoreSettings.homeEyebrow),
        homeTitle: asText(hero.title, defaultStoreSettings.homeTitle),
        homeDescription: asText(
          hero.description,
          defaultStoreSettings.homeDescription,
        ),
      };
    } catch (error) {
      console.warn("Public store settings could not be loaded:", error);
      return defaultStoreSettings;
    }
  },
);
