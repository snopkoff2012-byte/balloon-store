import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import {
  categories,
  getCategory,
  getProductsByCategory,
} from "@/data/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  return category
    ? { title: category.name, description: category.description }
    : { title: "Категория не найдена" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const categoryProducts = getProductsByCategory(category.slug);

  return (
    <Container className="py-12 sm:py-16">
      <div className="overflow-hidden rounded-[2rem] bg-[#f1ebe6] sm:rounded-[2.5rem]">
        <div className="grid items-stretch sm:grid-cols-[1fr_260px]">
          <div className="p-7 sm:p-12">
        <Link href="/catalog" className="text-sm font-bold text-[#7e6f78] hover:text-[#8d2444]">
          ← Вернуться в каталог
        </Link>
        <div className="mt-8">
          <PageHeading
            eyebrow="Категория"
            title={category.name}
            description={category.description}
          />
        </div>
          </div>
          <BalloonPhotoPlaceholder
            variant="product"
            compact
            className="min-h-64 sm:min-h-full"
            label={`Заглушка фотографии категории «${category.name}»`}
          />
        </div>
      </div>
      {categoryProducts.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
          В этой категории пока нет тестовых товаров.
        </div>
      )}
    </Container>
  );
}
