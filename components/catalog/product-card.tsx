import Link from "next/link";
import type { Product } from "@/data/catalog";
import { formatMoney } from "@/lib/money";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/5">
      <Link href={`/product/${product.slug}`} className="block">
        <div
          className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${product.accent}`}
        >
          <span className="text-7xl transition duration-300 group-hover:scale-110" aria-hidden="true">
            {product.emoji}
          </span>
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-600 shadow-sm">
              {product.badge}
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-950">{product.name}</h2>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
            {product.shortDescription}
          </p>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-slate-950">
                {formatMoney({
                  amountKopecks: product.priceKopecks,
                  currency: "RUB",
                })}
              </p>
              {product.oldPriceKopecks ? (
                <p className="text-sm text-slate-400 line-through">
                  {formatMoney({
                    amountKopecks: product.oldPriceKopecks,
                    currency: "RUB",
                  })}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              Подробнее
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
