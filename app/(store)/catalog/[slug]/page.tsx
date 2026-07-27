import type { Metadata } from "next";
import { CategoryView } from "@/components/catalog/category-view";
import { mockCatalogSeed } from "@/data/catalog-seed";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return mockCatalogSeed.categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = mockCatalogSeed.categories.find(
    (item) => item.slug === slug,
  );

  return category
    ? {
        title: category.seoTitle,
        description: category.seoDescription,
      }
    : { title: "Категория не найдена" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  return <CategoryView slug={slug} />;
}
