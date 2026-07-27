import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
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
      <div className={`rounded-[2.5rem] bg-gradient-to-br ${category.accent} p-8 sm:p-12`}>
        <Link href="/catalog" className="text-sm font-semibold text-slate-600 hover:text-rose-700">
          ← Вернуться в каталог
        </Link>
        <div className="mt-8 grid items-center gap-8 sm:grid-cols-[1fr_auto]">
          <PageHeading
            eyebrow="Категория"
            title={category.name}
            description={category.description}
          />
          <span className="text-8xl" aria-hidden="true">
            {category.emoji}
          </span>
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
