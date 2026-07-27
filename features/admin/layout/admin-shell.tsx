"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { AdminSignOut } from "@/features/admin/auth/admin-sign-out";
import { AdminDataProvider } from "@/features/admin/data/admin-data-provider";

const navigation = [
  { href: "/admin", label: "Главная", exact: true },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/delivery", label: "Доставка" },
  { href: "/admin/promos", label: "Промокоды" },
  { href: "/admin/settings", label: "Настройки" },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:py-16">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white">
        <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <Link href="/admin" className="block truncate text-base font-black">
              Воздушная Москва
            </Link>
            <p className="text-xs text-slate-400">Панель управления</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white sm:inline-flex"
            >
              Открыть магазин
            </Link>
            <AdminSignOut />
          </div>
        </Container>
        <Container>
          <nav
            aria-label="Разделы административной панели"
            className="-mx-1 flex gap-1 overflow-x-auto pb-3"
          >
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Container>
      </header>
      <main>
        <Container className="py-6 sm:py-8">
          <AdminDataProvider>{children}</AdminDataProvider>
        </Container>
      </main>
    </div>
  );
}
