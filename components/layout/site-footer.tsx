import Link from "next/link";
import { Container } from "@/components/ui/container";
import { mainNavigation } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#2d222b] text-white sm:mt-28">
      <Container className="grid gap-10 py-12 sm:py-16 md:grid-cols-[1.25fr_0.8fr_0.95fr]">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-full bg-[#a42a4d] text-xs font-black"
              aria-hidden="true"
            >
              ВМ
            </span>
            <p className="text-lg font-extrabold">Воздушная Москва</p>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/58">
            Собираем современные композиции из шаров и бережно доставляем их по
            Москве и Московской области.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="https://t.me/balloon_moscow_demo"
              className="rounded-full border border-white/14 px-4 py-2.5 text-sm font-bold transition hover:border-white/35 hover:bg-white/8 active:scale-95"
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
            <a
              href="https://wa.me/74950000000"
              className="rounded-full border border-white/14 px-4 py-2.5 text-sm font-bold transition hover:border-white/35 hover:bg-white/8 active:scale-95"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/45">
            Покупателям
          </p>
          <nav className="mt-5 grid gap-3.5" aria-label="Навигация в подвале">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit text-sm font-semibold text-white/68 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/45">
            Связаться
          </p>
          <div className="mt-5 grid gap-3 text-sm text-white/68">
            <a
              href="tel:+74950000000"
              className="w-fit text-lg font-extrabold text-white hover:text-[#f2ad92]"
            >
              +7 (495) 000-00-00
            </a>
            <a
              href="mailto:hello@example.ru"
              className="w-fit hover:text-white"
            >
              hello@example.ru
            </a>
            <p>Ежедневно, 09:00–21:00</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/8">
        <Container className="flex flex-col gap-2 py-5 text-[11px] text-white/38 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Воздушная Москва</p>
          <p>Демонстрационная версия — контакты и цены тестовые</p>
        </Container>
      </div>
    </footer>
  );
}
