import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Условия доставки воздушных шаров по Москве и Московской области.",
};

const deliveryCards = [
  {
    icon: "🚚",
    title: "Москва",
    text: "Доставляем ежедневно. Точную стоимость и интервал подтверждает менеджер после оформления заказа.",
  },
  {
    icon: "🗺️",
    title: "Московская область",
    text: "Стоимость зависит от расстояния. Мы согласуем её до сборки композиции.",
  },
  {
    icon: "💳",
    title: "Оплата",
    text: "В демонстрационной версии онлайн-оплата отключена. Способ оплаты согласовывается с менеджером.",
  },
];

export default function DeliveryPage() {
  return (
    <section className="py-10 sm:py-14">
      <PageHeading
        eyebrow="Условия заказа"
        title="Доставка и оплата"
        description="Бережно привезём готовую композицию к согласованному времени."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {deliveryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <span className="text-4xl" aria-hidden="true">
              {card.icon}
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-950">
              {card.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{card.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 rounded-3xl bg-amber-50 p-6 text-amber-950 sm:p-8">
        <h2 className="text-xl font-bold">Важно</h2>
        <p className="mt-3 max-w-3xl leading-7">
          Тарифы, платёжный провайдер и автоматический расчёт доставки будут
          подключены на следующих этапах. Сейчас страница показывает будущую
          структуру сервиса без приёма реальных платежей.
        </p>
      </div>
    </section>
  );
}
