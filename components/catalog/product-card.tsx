import Link from "next/link";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import {
  getProductPrice,
  type Product,
} from "@/features/catalog/types";
import { formatMoney } from "@/lib/money";

type ProductCardProps = {
  product: Product;
  headingLevel?: "h2" | "h3";
};

export function ProductCard({
  product,
  headingLevel = "h2",
}: ProductCardProps) {
  const Heading = headingLevel;
  const currentPrice = getProductPrice(product);
  const visualVariants = [
    "product",
    "birthday",
    "wedding",
    "baby",
    "gender",
  ] as const;
  const visualVariant =
    visualVariants[
      [...product.id].reduce((total, letter) => total + letter.charCodeAt(0), 0) %
        visualVariants.length
    ];
  const labels = [
    product.isBestseller ? "Хит" : null,
    product.isNew ? "Новинка" : null,
    product.isRecommended ? "Рекомендуем" : null,
    product.isMadeToOrder ? "Под заказ" : null,
  ].filter(Boolean);

  return (
    <article className="interactive-card group overflow-hidden rounded-[1.75rem] border border-[#e6ddd8] bg-white">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          <BalloonPhotoPlaceholder
            variant={visualVariant}
            compact
            className="aspect-[4/3] transition duration-500 group-hover:scale-[1.025]"
            label={`Заглушка фотографии товара «${product.name}»`}
          />
          <div className="absolute left-3 top-3 flex max-w-[80%] flex-wrap gap-1.5">
            {labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-extrabold text-[#922645] shadow-sm backdrop-blur"
              >
                {label}
              </span>
            ))}
          </div>
          {product.availabilityStatus === "out_of_stock" ? (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-[#342631]/88 px-3 py-2 text-center text-[11px] font-bold text-white backdrop-blur">
              Временно нет в наличии
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <Heading className="text-lg font-extrabold tracking-[-0.02em] text-[#30242d]">
            {product.name}
          </Heading>
          <p className="mt-2 min-h-12 text-sm leading-6 text-[#74666f]">
            {product.shortDescription}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee6e2] pt-4">
            <div>
              <p className="text-xl font-extrabold text-[#30242d]">
                {formatMoney({
                  amountKopecks: currentPrice,
                  currency: "RUB",
                })}
              </p>
              {product.salePriceKopecks ? (
                <p className="text-xs text-[#a89aa2] line-through">
                  {formatMoney({
                    amountKopecks: product.regularPriceKopecks,
                    currency: "RUB",
                  })}
                </p>
              ) : null}
            </div>
            <span className="flex size-10 items-center justify-center rounded-full border border-[#decdd3] text-lg text-[#8c2745] transition group-hover:border-[#a42a4d] group-hover:bg-[#a42a4d] group-hover:text-white">
              <span aria-hidden="true">→</span>
              <span className="sr-only">Подробнее</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
