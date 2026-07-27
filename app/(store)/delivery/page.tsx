import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Условия доставки воздушных шаров по Москве и Московской области.",
};

const deliveryCards = [
  {
    icon: "01",
    title: "Москва",
    text: "Доставляем ежедневно. Точную стоимость и интервал подтверждает менеджер после оформления заказа.",
  },
  {
    icon: "02",
    title: "Московская область",
    text: "Стоимость зависит от расстояния. Мы согласуем её до сборки композиции.",
  },
  {
    icon: "03",
    title: "Оплата",
    text: "В демонстрационной версии онлайн-оплата отключена. Способ оплаты согласовывается с менеджером.",
  },
];

export default function DeliveryPage() {
  return (
    <Container className="py-10 sm:py-16">
      <PageHeading
        eyebrow="Условия заказа"
        title="Доставка и оплата"
        description="Бережно привезём готовую композицию к согласованному времени."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {deliveryCards.map((card) => (
          <article
            key={card.title}
            className="interactive-card rounded-[1.75rem] border border-[#e5dbd6] bg-white p-6"
          >
            <span
              className="flex size-11 items-center justify-center rounded-full bg-[#f1dfd5] text-xs font-black text-[#7f2944]"
              aria-hidden="true"
            >
              {card.icon}
            </span>
            <h2 className="mt-5 text-xl font-extrabold text-[#342831]">
              {card.title}
            </h2>
            <p className="mt-3 leading-7 text-[#74666f]">{card.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 rounded-[1.75rem] bg-[#f1dfd5] p-6 text-[#4d3640] sm:p-8">
        <h2 className="text-xl font-extrabold">Важно</h2>
        <p className="mt-3 max-w-3xl leading-7">
          Тарифы, платёжный провайдер и автоматический расчёт доставки будут
          подключены на следующих этапах. Сейчас страница показывает будущую
          структуру сервиса без приёма реальных платежей.
        </p>
      </div>
    </Container>
  );
}
