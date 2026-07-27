import type { Metadata } from "next";
import { SettingsManager } from "@/features/admin/settings/settings-manager";
import { requireActiveAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Настройки сайта",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireActiveAdmin();
  return <SettingsManager />;
}
