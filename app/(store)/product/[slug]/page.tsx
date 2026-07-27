import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
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
      <nav aria-label="Хлебные крошки" className="flex flex-wrap gap-2 text-sm text-[#887a82]">
        <Link href="/" className="hover:text-[#8d2444]">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-[#8d2444]">Каталог</Link>
        {category ? (
          <>
            <span>/</span>
            <Link href={`/catalog/${category.slug}`} className="hover:text-[#8d2444]">
              {category.shortName}
            </Link>
          </>
        ) : null}
      </nav>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <BalloonPhotoPlaceholder
            variant="product"
            className="aspect-square rounded-[2rem] sm:rounded-[2.5rem]"
            label={`Заглушка большой фотографии товара «${product.name}»`}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            {(["product", "wedding", "birthday"] as const).map((variant) => (
              <BalloonPhotoPlaceholder
                key={variant}
                variant={variant}
                compact
                className="aspect-square rounded-2xl"
                label={`Заглушка дополнительной фотографии товара «${product.name}»`}
              />
            ))}
          </div>
        </div>
        <div className="lg:py-4">
          {product.badge ? (
            <span className="rounded-full bg-[#ead9df] px-3 py-1.5 text-xs font-extrabold text-[#8c2745]">
              {product.badge}
            </span>
          ) : null}
          <h1 className="mt-5 font-display text-4xl leading-[1.06] tracking-[-0.03em] text-[#2f232c] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-5 text-base leading-8 text-[#6f626b] sm:text-lg">{product.description}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-extrabold text-[#2f232c]">
              {formatMoney({ amountKopecks: product.priceKopecks, currency: "RUB" })}
            </p>
            {product.oldPriceKopecks ? (
              <p className="pb-1 text-lg text-[#aa9ca3] line-through">
                {formatMoney({ amountKopecks: product.oldPriceKopecks, currency: "RUB" })}
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-bold text-[#37714f]">
            ● В наличии — подготовим после подтверждения
          </p>
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
          <div className="mt-8 border-t border-[#e5dbd6] pt-7">
            <h2 className="text-lg font-extrabold text-[#2f232c]">Характеристики</h2>
            <dl className="mt-4 divide-y divide-[#e9dfda]">
              {product.attributes.map((attribute) => (
                <div key={attribute.label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                  <dt className="text-[#887a82]">{attribute.label}</dt>
                  <dd className="font-bold text-[#433640]">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </Container>
  );
}
