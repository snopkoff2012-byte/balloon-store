import type { Metadata } from "next";
import { DeliveryManager } from "@/features/admin/delivery/delivery-manager";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Доставка — управление",
  robots: { index: false, follow: false },
};

export default async function AdminDeliveryPage() {
  await requireActiveAdmin();
  return <DeliveryManager />;
}
