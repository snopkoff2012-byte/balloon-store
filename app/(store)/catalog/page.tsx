import type { Metadata } from "next";
import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import { categories, products } from "@/data/catalog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Каталог воздушных шаров",
  description: "Тестовый каталог наборов и композиций из воздушных шаров.",
};

export default function CatalogPage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeading
        eyebrow="Каталог"
        title="Воздушные шары и готовые наборы"
        description="Сейчас каталог работает на тестовых данных. На следующем этапе товары будут загружаться из базы."
      />
      <nav
        className="mt-8 flex gap-2 overflow-x-auto pb-2"
        aria-label="Категории каталога"
      >
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalog/${category.slug}`}
            className="shrink-0 rounded-full border border-[#ddd1d6] bg-white px-4 py-2.5 text-sm font-bold text-[#62545d] transition hover:border-[#b88c9c] hover:text-[#8d2444] active:scale-95"
          >
            {category.shortName}
          </Link>
        ))}
      </nav>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
