"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductCard } from "./product-card";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { Container } from "@/components/ui/container";
import {
  getCategoryTrail,
  getRelatedProducts,
} from "@/features/catalog/selectors";
import { useCatalogStore } from "@/features/catalog/store";
import { getProductPrice } from "@/features/catalog/types";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";

function availabilityText(status: string, stock: number, madeToOrder: boolean) {
  if (madeToOrder || status === "preorder") return "Под заказ";
  if (status === "out_of_stock") return "Нет в наличии";
  if (status === "limited") return `Осталось: ${stock}`;
  return "В наличии — подготовим после подтверждения";
}

export function ProductDetails({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const products = useCatalogStore((state) => state.products);
  const product = products.find(
    (item) => item.slug === slug && item.publicationStatus === "published",
  );

  if (!hydrated) {
    return (
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-[#eee5e0]" />
          <div className="h-96 animate-pulse rounded-[2rem] bg-[#f3ece8]" />
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-16">
        <div className="rounded-[2rem] border border-dashed border-[#d9c7cd] bg-white p-10 text-center">
          <h1 className="font-display text-3xl text-[#342831]">
            Товар сейчас недоступен
          </h1>
          <p className="mt-3 text-[#776a72]">
            Он мог быть скрыт администратором или снят с публикации.
          </p>
          <Link href="/catalog" className="button-primary mt-6">
            Посмотреть другие товары
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <ProductDetailsContent
      key={`${product.id}-${product.updatedAt}`}
      productId={product.id}
    />
  );
}

function ProductDetailsContent({ productId }: { productId: string }) {
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const product = products.find((item) => item.id === productId)!;
  const primaryCategory = categories.find(
    (item) => item.id === product.primaryCategoryId,
  );
  const breadcrumbs = primaryCategory
    ? getCategoryTrail(categories, primaryCategory.id)
    : [];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      product.options.map((option) => [option.id, option.values[0]?.id ?? ""]),
    ),
  );

  const selectedValues = useMemo(
    () =>
      product.options.flatMap((option) => {
        const value = option.values.find((item) => item.id === selected[option.id]);
        return value ? [{ option, value }] : [];
      }),
    [product.options, selected],
  );
  const optionSurcharge = selectedValues.reduce(
    (total, item) => total + item.value.priceModifierKopecks,
    0,
  );
  const unitPrice = getProductPrice(product) + optionSurcharge;
  const related = getRelatedProducts(products, product, 3);
  const unavailable = product.availabilityStatus === "out_of_stock";

  return (
    <Container className="py-10 sm:py-14">
      <nav
        aria-label="Хлебные крошки"
        className="flex flex-wrap gap-2 text-sm text-[#887a82]"
      >
        <Link href="/" className="hover:text-[#8d2444]">Главная</Link>
        <span aria-hidden="true">/</span>
        <Link href="/catalog" className="hover:text-[#8d2444]">Каталог</Link>
        {breadcrumbs.map((category) => (
          <span key={category.id} className="contents">
            <span aria-hidden="true">/</span>
            <Link
              href={`/catalog/${category.slug}`}
              className="hover:text-[#8d2444]"
            >
              {category.name}
            </Link>
          </span>
        ))}
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-[#4a3b44]">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-[1fr_112px]">
          <BalloonPhotoPlaceholder
            variant="product"
            className="aspect-square rounded-[2rem] sm:rounded-[2.5rem]"
            label={`Главная фотография товара «${product.name}»`}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            {product.images.slice(0, 3).map((image, index) => (
              <BalloonPhotoPlaceholder
                key={image.id}
                variant={index === 1 ? "wedding" : index === 2 ? "birthday" : "product"}
                compact
                className="aspect-square rounded-2xl"
                label={image.alt}
              />
            ))}
          </div>
        </div>

        <div className="lg:py-2">
          <div className="flex flex-wrap gap-2">
            {product.isBestseller ? (
              <span className="rounded-full bg-[#ead9df] px-3 py-1.5 text-xs font-extrabold text-[#8c2745]">
                Хит
              </span>
            ) : null}
            {product.isNew ? (
              <span className="rounded-full bg-[#ead9df] px-3 py-1.5 text-xs font-extrabold text-[#8c2745]">
                Новинка
              </span>
            ) : null}
            {product.isRecommended ? (
              <span className="rounded-full bg-[#ead9df] px-3 py-1.5 text-xs font-extrabold text-[#8c2745]">
                Рекомендуем
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-[1.06] tracking-[-0.03em] text-[#2f232c] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-4 text-sm text-[#8b7c84]">Артикул: {product.sku}</p>
          <p className="mt-5 text-base leading-8 text-[#6f626b] sm:text-lg">
            {product.fullDescription}
          </p>

          {product.options.map((option) => (
            <fieldset key={option.id} className="mt-7">
              <legend className="text-sm font-extrabold text-[#342831]">
                {option.name}
                {option.required ? " *" : ""}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const checked = selected[option.id] === value.id;
                  return (
                    <label
                      key={value.id}
                      className={`cursor-pointer rounded-full border px-4 py-3 text-sm font-bold transition active:scale-[0.97] ${
                        checked
                          ? "border-[#9d2b4c] bg-[#9d2b4c] text-white"
                          : "border-[#ddd1d6] bg-white text-[#5f5059] hover:border-[#b96c82]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={option.id}
                        value={value.id}
                        checked={checked}
                        onChange={() =>
                          setSelected((current) => ({
                            ...current,
                            [option.id]: value.id,
                          }))
                        }
                        className="sr-only"
                      />
                      {value.label}
                      {value.priceModifierKopecks > 0
                        ? ` +${formatMoney({
                            amountKopecks: value.priceModifierKopecks,
                            currency: "RUB",
                          })}`
                        : ""}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mt-8 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold text-[#2f232c]">
              {formatMoney({ amountKopecks: unitPrice, currency: "RUB" })}
            </p>
            {product.regularPriceKopecks > getProductPrice(product) ? (
              <p className="pb-1 text-lg text-[#aa9ca3] line-through">
                {formatMoney({
                  amountKopecks: product.regularPriceKopecks + optionSurcharge,
                  currency: "RUB",
                })}
              </p>
            ) : null}
          </div>
          <p
            className={`mt-3 text-sm font-bold ${
              unavailable ? "text-[#a53a42]" : "text-[#37714f]"
            }`}
          >
            ● {availabilityText(
              product.availabilityStatus,
              product.stockQuantity ?? 0,
              product.isMadeToOrder,
            )}
          </p>
          <div className="mt-7">
            <AddToCartButton
              product={product}
              unitPriceKopecks={unitPrice}
              selectedOptions={selected}
              selectedOptionLabels={selectedValues.map(
                ({ option, value }) => `${option.name}: ${value.label}`,
              )}
              disabled={unavailable}
            />
          </div>

          <section className="mt-8 border-t border-[#e5dbd6] pt-7">
            <h2 className="text-lg font-extrabold text-[#2f232c]">
              Характеристики
            </h2>
            <dl className="mt-4 divide-y divide-[#e9dfda]">
              {product.attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="grid grid-cols-2 gap-4 py-3 text-sm"
                >
                  <dt className="text-[#887a82]">{attribute.name}</dt>
                  <dd className="font-bold text-[#433640]">
                    {Array.isArray(attribute.value)
                      ? attribute.value.join(", ")
                      : String(attribute.value)}
                    {attribute.unit ? ` ${attribute.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-[#e5dbd6] pt-12">
          <h2 className="font-display text-3xl text-[#342831]">
            Вам также может понравиться
          </h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} headingLevel="h3" />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
