import Link from "next/link";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import type { Product } from "@/data/catalog";
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

  return (
    <article className="interactive-card group overflow-hidden rounded-[1.75rem] border border-[#e6ddd8] bg-white">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          <BalloonPhotoPlaceholder
            variant="product"
            compact
            className="aspect-[4/3] transition duration-500 group-hover:scale-[1.025]"
            label={`Заглушка фотографии товара «${product.name}»`}
          />
          {product.badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold text-[#922645] shadow-sm backdrop-blur">
              {product.badge}
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
                  amountKopecks: product.priceKopecks,
                  currency: "RUB",
                })}
              </p>
              {product.oldPriceKopecks ? (
                <p className="text-xs text-[#a89aa2] line-through">
                  {formatMoney({
                    amountKopecks: product.oldPriceKopecks,
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
