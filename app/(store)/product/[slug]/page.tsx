import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { Container } from "@/components/ui/container";
import {
  getCategory,
  getProduct,
  products,
} from "@/data/catalog";
import { formatMoney } from "@/lib/money";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product
    ? { title: product.name, description: product.shortDescription }
    : { title: "Товар не найден" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const category = getCategory(product.categorySlug);

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Хлебные крошки" className="flex flex-wrap gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-rose-700">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-rose-700">Каталог</Link>
        {category ? (
          <>
            <span>/</span>
            <Link href={`/catalog/${category.slug}`} className="hover:text-rose-700">
              {category.shortName}
            </Link>
          </>
        ) : null}
      </nav>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div className={`flex aspect-square items-center justify-center rounded-[2.5rem] bg-gradient-to-br ${product.accent}`}>
            <span className="text-[9rem] sm:text-[12rem]" aria-hidden="true">
              {product.emoji}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            {[product.emoji, "🎈", "✨"].map((emoji, index) => (
              <div
                key={`${emoji}-${index}`}
                className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br ${product.accent} text-4xl`}
                aria-hidden="true"
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:py-4">
          {product.badge ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
              {product.badge}
            </span>
          ) : null}
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-bold text-slate-950">
              {formatMoney({ amountKopecks: product.priceKopecks, currency: "RUB" })}
            </p>
            {product.oldPriceKopecks ? (
              <p className="pb-1 text-lg text-slate-400 line-through">
                {formatMoney({ amountKopecks: product.oldPriceKopecks, currency: "RUB" })}
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-medium text-emerald-700">
            ● В наличии — подготовим после подтверждения
          </p>
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
          <div className="mt-8 border-t border-slate-200 pt-7">
            <h2 className="text-lg font-bold text-slate-950">Характеристики</h2>
            <dl className="mt-4 divide-y divide-slate-200">
              {product.attributes.map((attribute) => (
                <div key={attribute.label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                  <dt className="text-slate-500">{attribute.label}</dt>
                  <dd className="font-medium text-slate-900">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </Container>
  );
}
