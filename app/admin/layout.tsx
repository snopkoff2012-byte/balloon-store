import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AdminSignOut } from "@/features/admin/auth/admin-sign-out";
import { getOptionalPublicEnvironment } from "@/lib/environment";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isSupabaseConfigured = Boolean(getOptionalPublicEnvironment());

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/admin" className="font-bold">
              Воздушная Москва · Управление
            </Link>
            <nav aria-label="Разделы административной панели" className="flex gap-4 text-sm text-slate-300">
              <Link href="/admin/categories" className="hover:text-white">
                Категории
              </Link>
              <Link href="/admin/products" className="hover:text-white">
                Товары
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Вернуться в магазин
            </Link>
            {isSupabaseConfigured ? <AdminSignOut /> : null}
          </div>
        </Container>
      </header>
      <main>
        <Container className="py-8 sm:py-10">{children}</Container>
      </main>
    </div>
  );
}
