import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { CategoryNavigation } from "@/components/catalog/category-navigation";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = {
  title: "Каталог воздушных шаров",
  description:
    "Композиции и наборы воздушных шаров с доставкой по Москве и Московской области.",
};

export default function CatalogPage() {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeading
        eyebrow="Каталог"
        title="Шары для вашего события"
        description="Выбирайте готовую композицию, настраивайте цвет, размер и дополнительные детали. Все цены пересчитываются сразу."
      />
      <div className="mt-8">
        <CategoryNavigation />
      </div>
      <CatalogBrowser />
    </Container>
  );
}
