import type { Metadata } from "next";
import { ProductDetails } from "@/components/catalog/product-details";
import { mockCatalogSeed } from "@/data/catalog-seed";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return mockCatalogSeed.products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = mockCatalogSeed.products.find((item) => item.slug === slug);
  return product
    ? { title: product.seoTitle, description: product.seoDescription }
    : { title: "Товар не найден" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return <ProductDetails slug={slug} />;
}
