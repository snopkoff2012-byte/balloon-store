export type OrderStatus =
  | "new"
  | "confirmed"
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "handed_to_courier"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "awaiting"
  | "paid"
  | "refunded"
  | "failed";

export type DeliveryStatus =
  | "not_scheduled"
  | "scheduled"
  | "courier_assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitPriceKopecks: number;
  lineTotalKopecks: number;
  productName: string;
  sku: string;
  image: string;
  selectedOptions: Record<string, unknown>;
};

export type AdminOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerComment: string;
  managerComment: string;
  deliveryAddress: Record<string, unknown>;
  deliveryZoneId: string | null;
  deliveryZoneSnapshot: Record<string, unknown>;
  deliveryPricePending: boolean;
  deliveryRequiresConfirmation: boolean;
  requestedDeliveryDate: string | null;
  requestedDeliverySlot: string;
  itemsTotalKopecks: number;
  discountKopecks: number;
  deliveryKopecks: number | null;
  totalKopecks: number | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryStatus: DeliveryStatus;
  urgentDelivery: boolean;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};

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

export type PromoCode = {
  id: string;
  code: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minimumOrderKopecks: number;
  maximumDiscountKopecks: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  phone: string;
  email: string;
  telegram: string;
  telegramEnabled: boolean;
  whatsapp: string;
  whatsappEnabled: boolean;
  address: string;
  workingHours: string;
  minimumOrderRub: number;
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
};

export type AdminOperationsSnapshot = {
  orders: AdminOrder[];
  deliveryZones: DeliveryZone[];
  promoCodes: PromoCode[];
  settings: StoreSettings;
};

export const defaultStoreSettings: StoreSettings = {
  phone: "+7 (495) 000-00-00",
  email: "hello@example.ru",
  telegram: "balloon_moscow_demo",
  telegramEnabled: true,
  whatsapp: "+7 495 000-00-00",
  whatsappEnabled: true,
  address: "Москва, Большая Никитская улица, 24",
  workingHours: "09:00–21:00",
  minimumOrderRub: 3000,
  homeEyebrow: "Доставим праздник сегодня",
  homeTitle: "Воздушные шары с настроением",
  homeDescription:
    "Соберём композицию под ваш повод и аккуратно привезём по Москве и области.",
};
import type {
  DeliveryPricingMode,
  DeliveryZoneType,
} from "@/features/delivery/types";
