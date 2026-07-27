import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Демонстрационная форма оформления заказа воздушных шаров.",
};

export default function CheckoutPage() {
  return (
    <section className="py-10 sm:py-14">
      <PageHeading
        eyebrow="Без регистрации"
        title="Оформление заказа"
        description="Укажите контакты и удобное время. На этом этапе форма работает с тестовыми данными и ничего не отправляет."
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CheckoutForm />
        <aside className="h-fit rounded-3xl bg-violet-50 p-6 text-sm leading-6 text-violet-950">
          <h2 className="text-lg font-bold">Как это будет работать</h2>
          <ol className="mt-4 grid gap-3">
            <li>1. Менеджер проверит наличие.</li>
            <li>2. Уточнит адрес и стоимость доставки.</li>
            <li>3. Подтвердит итоговую сумму и время.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
