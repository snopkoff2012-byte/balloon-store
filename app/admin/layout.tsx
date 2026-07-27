import { AdminShell } from "@/features/admin/layout/admin-shell";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
