import type { Metadata } from "next";
import { OrderManager } from "@/features/admin/orders/order-manager";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Заказы — управление",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  await requireActiveAdmin();
  return <OrderManager />;
}
