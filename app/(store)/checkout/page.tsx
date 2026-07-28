import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { loadPublicDeliveryZones } from "@/features/delivery/server-repository";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Демонстрационная форма оформления заказа воздушных шаров.",
};

export default async function CheckoutPage() {
  const delivery = await loadPublicDeliveryZones();

  return (
    <Container className="py-10 sm:py-16">
      <PageHeading
        eyebrow="Без регистрации"
        title="Оформление заказа"
        description="Укажите контакты и удобное время. Заказ создаётся на сервере после повторной проверки состава корзины и цены."
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CheckoutForm
          deliveryZones={delivery.zones}
          deliveryZonesUnavailable={delivery.unavailable}
        />
        <aside className="h-fit rounded-[1.75rem] bg-[#ded8ea] p-6 text-sm leading-6 text-[#403448]">
          <h2 className="text-lg font-extrabold">Как это будет работать</h2>
          <ol className="mt-4 grid gap-3">
            <li>1. Менеджер проверит наличие.</li>
            <li>2. Проверит выбранную зону и адрес доставки.</li>
            <li>3. Подтвердит итоговую сумму и время.</li>
          </ol>
        </aside>
      </div>
    </Container>
  );
}
