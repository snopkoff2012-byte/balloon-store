import Link from "next/link";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { Container } from "@/components/ui/container";
import { mainNavigation } from "@/lib/navigation";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-[#342631] text-white">
        <Container className="flex min-h-8 items-center justify-center gap-2 py-1 text-center text-[11px] font-bold sm:text-xs">
          <span className="size-1.5 rounded-full bg-[#f0a182]" aria-hidden="true" />
          Доставка по Москве и области ежедневно с 09:00 до 23:00
        </Container>
      </div>
      <div className="border-b border-[#e8dfda] bg-[#fbf8f4]/95 backdrop-blur-xl">
        <Container className="relative flex h-17 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label="Воздушная Москва — на главную"
          >
            <span
              className="relative flex size-10 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute left-1 top-1 size-7 rounded-full bg-[#a42a4d] transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="absolute bottom-1 right-0 size-6 rounded-full bg-[#ef9d7f] transition-transform duration-300 group-hover:translate-y-0.5" />
              <span className="relative z-10 text-[10px] font-black tracking-[-0.05em] text-white">
                ВМ
              </span>
            </span>
            <span>
              <span className="block text-[15px] font-extrabold tracking-[-0.03em] text-[#281d28] sm:text-base">
                Воздушная Москва
              </span>
              <span className="block text-[10px] font-semibold text-[#8b7b84] sm:text-[11px]">
                шары для ваших событий
              </span>
            </span>
          </Link>

          <nav
            aria-label="Основная навигация"
            className="hidden items-center gap-7 lg:flex"
          >
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-2 text-sm font-bold text-[#5d5059] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-[#a42a4d] after:transition-transform hover:text-[#8d2444] hover:after:origin-left hover:after:scale-x-100 active:opacity-70"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:+74950000000"
              className="hidden text-right md:block"
            >
              <span className="block text-sm font-extrabold text-[#342631]">
                +7 (495) 000-00-00
              </span>
              <span className="block text-[11px] font-semibold text-[#a42a4d]">
                Ответим за 5 минут
              </span>
            </a>
            <CartIndicator />
            <MobileMenu />
          </div>
        </Container>
      </div>
    </header>
  );
}
