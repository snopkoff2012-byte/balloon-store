import Link from "next/link";
import { Container } from "@/components/ui/container";
import { mainNavigation } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-xl font-bold">Воздушная Москва</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            Первая рабочая версия магазина воздушных шаров. Цены и контакты на
            этом этапе используются для демонстрации структуры.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Покупателям
          </p>
          <nav className="mt-4 grid gap-3" aria-label="Навигация в подвале">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-400 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Связаться
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <a href="tel:+74950000000" className="hover:text-white">
              +7 (495) 000-00-00
            </a>
            <a href="mailto:hello@example.ru" className="hover:text-white">
              hello@example.ru
            </a>
            <p>Ежедневно, 09:00–21:00</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Воздушная Москва</p>
          <p>Демонстрационная версия — заказы не отправляются</p>
        </Container>
      </div>
    </footer>
  );
}
