import Link from "next/link";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { Container } from "@/components/ui/container";
import { mainNavigation } from "@/lib/navigation";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rose-100/80 bg-[#fffaf7]/95 backdrop-blur">
      <Container className="relative flex h-18 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" aria-label="На главную">
          <span
            className="flex size-10 items-center justify-center rounded-full bg-rose-500 text-xl shadow-sm"
            aria-hidden="true"
          >
            🎈
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-950">
              Воздушная Москва
            </span>
            <span className="block text-xs text-slate-500">
              шары с доставкой
            </span>
          </span>
        </Link>

        <nav
          aria-label="Основная навигация"
          className="hidden items-center gap-8 lg:flex"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-rose-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+74950000000"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white md:block"
          >
            +7 (495) 000-00-00
          </a>
          <CartIndicator />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
