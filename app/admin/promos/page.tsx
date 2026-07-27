import type { Metadata } from "next";
import { PromoManager } from "@/features/admin/promotions/promo-manager";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Промокоды — управление",
  robots: { index: false, follow: false },
};

export default async function AdminPromosPage() {
  await requireActiveAdmin();
  return <PromoManager />;
}
