import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты магазина воздушных шаров «Воздушная Москва».",
};

export default function ContactsPage() {
  return (
    <section className="py-10 sm:py-14">
      <PageHeading
        eyebrow="Мы на связи"
        title="Контакты"
        description="Тестовые контакты помогут проверить структуру страницы. Перед запуском они будут заменены на реальные."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <dl className="grid gap-6">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Телефон</dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">
                +7 (495) 000-00-00
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Почта</dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">
                hello@example.ru
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Время работы
              </dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">
                Ежедневно, 09:00–21:00
              </dd>
            </div>
          </dl>
        </div>
        <div className="grid min-h-72 place-items-center rounded-3xl bg-[radial-gradient(circle_at_25%_25%,#fda4af,transparent_22%),radial-gradient(circle_at_70%_65%,#c4b5fd,transparent_25%),linear-gradient(135deg,#fff1f2,#f5f3ff)] p-8 text-center">
          <div>
            <span className="text-6xl" aria-hidden="true">
              🎈
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              Москва и Московская область
            </h2>
            <p className="mt-2 text-slate-600">
              Карта и адрес мастерской появятся перед реальным запуском.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
