import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/catalog/admin-dashboard";

export const metadata: Metadata = {
  title: "Административная панель",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
