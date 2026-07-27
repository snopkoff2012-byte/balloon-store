import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import { CartView } from "@/features/cart/cart-view";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Выбранные воздушные шары и праздничные композиции.",
};

export default function CartPage() {
  return (
    <Container className="py-10 sm:py-16">
      <PageHeading
        eyebrow="Ваш заказ"
        title="Корзина"
        description="Проверьте состав заказа и количество товаров перед оформлением."
      />
      <div className="mt-8">
        <CartView />
      </div>
    </Container>
  );
}
