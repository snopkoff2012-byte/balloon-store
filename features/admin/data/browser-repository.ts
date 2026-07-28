"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { withSupabaseRequestTimeout } from "@/lib/supabase/request-timeout";
import {
  defaultStoreSettings,
  type AdminOperationsSnapshot,
  type AdminOrder,
  type DeliveryZone,
  type PromoCode,
  type StoreSettings,
} from "./types";

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function nullableNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function loadAdminOperations(): Promise<AdminOperationsSnapshot> {
  const supabase = createBrowserSupabaseClient();
  const [ordersResult, itemsResult, zonesResult, promosResult, settingsResult] =
    await withSupabaseRequestTimeout((signal) =>
      Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .abortSignal(signal),
        supabase
          .from("order_items")
          .select("*")
          .order("created_at")
          .abortSignal(signal),
        supabase
          .from("delivery_zones")
          .select("*")
          .order("sort_order")
          .abortSignal(signal),
        supabase
          .from("promo_codes")
          .select("*")
          .order("created_at", { ascending: false })
          .abortSignal(signal),
        supabase
          .from("site_settings")
          .select("key,value")
          .abortSignal(signal),
      ] as const),
    );

  [
    ordersResult,
    itemsResult,
    zonesResult,
    promosResult,
    settingsResult,
  ].forEach((result) => assertNoError(result.error));

  const items = (
    (itemsResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const snapshot = objectValue(row.product_snapshot);
    return {
      id: String(row.id),
      productId: row.product_id ? String(row.product_id) : null,
      variantId: row.variant_id ? String(row.variant_id) : null,
      quantity: numberValue(row.quantity),
      unitPriceKopecks: numberValue(row.unit_price_kopecks),
      lineTotalKopecks: numberValue(row.line_total_kopecks),
      productName: String(snapshot.name ?? "Товар"),
      sku: String(snapshot.sku ?? ""),
      image: String(snapshot.image ?? "/og.png"),
      selectedOptions: objectValue(row.selected_options),
      orderId: String(row.order_id),
    };
  });

  const orders: AdminOrder[] = (
    (ordersResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    orderNumber: numberValue(row.order_number),
    status: row.status as AdminOrder["status"],
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerEmail: String(row.customer_email ?? ""),
    customerComment: String(row.comment ?? ""),
    managerComment: String(row.manager_comment ?? ""),
    deliveryAddress: objectValue(row.delivery_address),
    deliveryZoneId: row.delivery_zone_id ? String(row.delivery_zone_id) : null,
    deliveryZoneSnapshot: objectValue(row.delivery_zone_snapshot),
    deliveryPricePending: Boolean(row.delivery_price_pending),
    deliveryRequiresConfirmation: Boolean(
      row.delivery_requires_confirmation,
    ),
    requestedDeliveryDate: row.requested_delivery_date
      ? String(row.requested_delivery_date)
      : null,
    requestedDeliverySlot: String(row.requested_delivery_slot ?? ""),
    itemsTotalKopecks: numberValue(row.items_total_kopecks),
    discountKopecks: numberValue(row.discount_kopecks),
    deliveryKopecks: nullableNumber(row.delivery_kopecks),
    totalKopecks: nullableNumber(row.total_kopecks),
    paymentStatus: (row.payment_status ?? "pending") as AdminOrder["paymentStatus"],
    paymentMethod: String(row.payment_method ?? "on_confirmation"),
    deliveryStatus: (row.delivery_status ??
      "not_scheduled") as AdminOrder["deliveryStatus"],
    urgentDelivery: Boolean(row.urgent_delivery),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    items: items
      .filter((item) => item.orderId === String(row.id))
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceKopecks: item.unitPriceKopecks,
        lineTotalKopecks: item.lineTotalKopecks,
        productName: item.productName,
        sku: item.sku,
        image: item.image,
        selectedOptions: item.selectedOptions,
      })),
  }));

  const deliveryZones: DeliveryZone[] = (
    (zonesResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description: String(row.description ?? ""),
      zoneType: String(row.zone_type) as DeliveryZone["zoneType"],
      matchTerms: stringArray(row.match_terms),
      pricingMode: String(row.pricing_mode) as DeliveryZone["pricingMode"],
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
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
  }));

  const promoCodes: PromoCode[] = (
    (promosResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
      id: String(row.id),
      code: String(row.code),
      description: String(row.description ?? ""),
      discountType: row.discount_type as PromoCode["discountType"],
      discountValue: numberValue(row.discount_value),
      minimumOrderKopecks: numberValue(row.minimum_order_kopecks),
      maximumDiscountKopecks: nullableNumber(row.maximum_discount_kopecks),
      startsAt: row.starts_at ? String(row.starts_at) : null,
      endsAt: row.ends_at ? String(row.ends_at) : null,
      usageLimit: nullableNumber(row.usage_limit),
      perCustomerLimit: nullableNumber(row.per_customer_limit),
      usageCount: numberValue(row.usage_count),
      isActive: Boolean(row.is_active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
  }));

  const rows = new Map(
    ((settingsResult.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => [String(row.key), objectValue(row.value)] as const,
    ),
  );
  const contacts = rows.get("store.contacts") ?? {};
  const hours = rows.get("store.working_hours") ?? {};
  const checkout = rows.get("store.checkout") ?? {};
  const hero = rows.get("home.hero") ?? {};
  const settings: StoreSettings = {
    ...defaultStoreSettings,
    phone: String(contacts.phone ?? defaultStoreSettings.phone),
    email: String(contacts.email ?? defaultStoreSettings.email),
    telegram: String(contacts.telegram ?? defaultStoreSettings.telegram),
    telegramEnabled: Boolean(contacts.telegramEnabled ?? defaultStoreSettings.telegramEnabled),
    whatsapp: String(contacts.whatsapp ?? defaultStoreSettings.whatsapp),
    whatsappEnabled: Boolean(contacts.whatsappEnabled ?? defaultStoreSettings.whatsappEnabled),
    address: String(contacts.address ?? defaultStoreSettings.address),
    workingHours: String(hours.daily ?? defaultStoreSettings.workingHours),
    minimumOrderRub: numberValue(
      checkout.minimumOrderRub ?? defaultStoreSettings.minimumOrderRub,
    ),
    homeEyebrow: String(hero.eyebrow ?? defaultStoreSettings.homeEyebrow),
    homeTitle: String(hero.title ?? defaultStoreSettings.homeTitle),
    homeDescription: String(
      hero.description ?? defaultStoreSettings.homeDescription,
    ),
  };

  return { orders, deliveryZones, promoCodes, settings };
}

export async function saveOrder(order: AdminOrder) {
  const supabase = createBrowserSupabaseClient();
  const deliveryKopecks = order.deliveryKopecks;
  const totalKopecks =
    deliveryKopecks === null
      ? null
      : order.itemsTotalKopecks - order.discountKopecks + deliveryKopecks;
  const { error } = await supabase
    .from("orders")
    .update({
      status: order.status,
      manager_comment: order.managerComment,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      delivery_status: order.deliveryStatus,
      delivery_zone_id: order.deliveryZoneId,
      requested_delivery_date: order.requestedDeliveryDate,
      requested_delivery_slot: order.requestedDeliverySlot,
      delivery_kopecks: deliveryKopecks,
      total_kopecks: totalKopecks,
      delivery_price_pending: deliveryKopecks === null,
      delivery_requires_confirmation: order.deliveryRequiresConfirmation,
      urgent_delivery: order.urgentDelivery,
    })
    .eq("id", order.id);
  assertNoError(error);
}

export async function saveDeliveryZone(zone: DeliveryZone) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("delivery_zones").upsert({
    id: zone.id,
    name: zone.name,
    slug: zone.slug,
    description: zone.description,
    zone_type: zone.zoneType,
    match_terms: zone.matchTerms,
    pricing_mode: zone.pricingMode,
    base_price_kopecks: zone.basePriceKopecks,
    price_per_km_kopecks: zone.pricePerKmKopecks,
    free_from_kopecks: zone.freeFromKopecks,
    minimum_order_kopecks: zone.minimumOrderKopecks,
    urgent_delivery_available: zone.urgentDeliveryAvailable,
    urgent_surcharge_kopecks: zone.urgentSurchargeKopecks,
    delivery_intervals: zone.deliveryIntervals,
    requires_manager_confirmation: zone.requiresManagerConfirmation,
    is_active: zone.isActive,
    sort_order: zone.sortOrder,
    created_at: zone.createdAt,
  });
  assertNoError(error);
}

export async function deleteDeliveryZone(id: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  assertNoError(error);
}

export async function savePromoCode(promo: PromoCode) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("promo_codes").upsert({
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discount_type: promo.discountType,
    discount_value: promo.discountValue,
    minimum_order_kopecks: promo.minimumOrderKopecks,
    maximum_discount_kopecks: promo.maximumDiscountKopecks,
    starts_at: promo.startsAt,
    ends_at: promo.endsAt,
    usage_limit: promo.usageLimit,
    per_customer_limit: promo.perCustomerLimit,
    usage_count: promo.usageCount,
    is_active: promo.isActive,
    created_at: promo.createdAt,
  });
  assertNoError(error);
}

export async function deletePromoCode(id: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  assertNoError(error);
}

export async function saveStoreSettings(settings: StoreSettings) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("site_settings").upsert([
    {
      key: "store.contacts",
      value: {
        phone: settings.phone,
        email: settings.email,
        telegram: settings.telegram,
        telegramEnabled: settings.telegramEnabled,
        whatsapp: settings.whatsapp,
        whatsappEnabled: settings.whatsappEnabled,
        address: settings.address,
      },
      description: "Контакты магазина",
    },
    {
      key: "store.working_hours",
      value: { timezone: "Europe/Moscow", daily: settings.workingHours },
      description: "Режим работы",
    },
    {
      key: "store.checkout",
      value: { minimumOrderRub: settings.minimumOrderRub },
      description: "Ограничения оформления заказа",
    },
    {
      key: "home.hero",
      value: {
        eyebrow: settings.homeEyebrow,
        title: settings.homeTitle,
        description: settings.homeDescription,
      },
      description: "Тексты первого экрана",
    },
  ]);
  assertNoError(error);
}
