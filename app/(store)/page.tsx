import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { categories, products } from "@/data/catalog";

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b border-rose-100 bg-[radial-gradient(circle_at_top_right,_#fecdd3,_transparent_38%),linear-gradient(135deg,#fff7ed,#fff1f2)]">
        <Container className="grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="inline-flex rounded-full border border-rose-200 bg-white/70 px-4 py-2 text-sm font-semibold text-rose-700">
              Доставка по Москве и Московской области
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">
              Праздник начинается с{" "}
              <span className="text-rose-600">воздушного настроения</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Готовые наборы и композиции из шаров. Выберите вариант в каталоге,
              а менеджер подтвердит детали и стоимость доставки.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalog"
                className="rounded-full bg-rose-600 px-7 py-4 text-center font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700"
              >
                Смотреть каталог
              </Link>
              <Link
                href="/delivery"
                className="rounded-full border border-slate-300 bg-white/70 px-7 py-4 text-center font-bold text-slate-800 hover:bg-white"
              >
                Условия доставки
              </Link>
            </div>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-lg items-center justify-center rounded-[3rem] bg-white/60 shadow-2xl shadow-rose-900/10">
            <div className="absolute left-[12%] top-[20%] size-32 rounded-full bg-rose-300 shadow-xl sm:size-40" />
            <div className="absolute right-[12%] top-[12%] size-28 rounded-full bg-violet-300 shadow-xl sm:size-36" />
            <div className="absolute bottom-[13%] left-[28%] size-36 rounded-full bg-amber-200 shadow-xl sm:size-44" />
            <span className="relative z-10 text-[8rem] drop-shadow-xl sm:text-[11rem]" aria-hidden="true">
              🎈
            </span>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
                Категории
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Найдите шары для вашего повода
              </h2>
            </div>
            <Link
              href="/catalog"
              className="font-semibold text-rose-700 hover:text-rose-800"
            >
              Весь каталог →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog/${category.slug}`}
                className={`group rounded-3xl border border-white bg-gradient-to-br ${category.accent} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className="text-4xl" aria-hidden="true">
                  {category.emoji}
                </span>
                <h3 className="mt-6 text-lg font-bold text-slate-950">
                  {category.shortName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
              Популярное
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Наборы, которые выбирают чаще всего
            </h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-6 md:grid-cols-3">
          {[
            ["⏱️", "Точно ко времени", "Согласуем удобный интервал и заранее подготовим заказ."],
            ["🎨", "Палитра на выбор", "Подберём оттенки под событие, интерьер или фирменные цвета."],
            ["💬", "Подтверждение менеджером", "Проверим состав, адрес и итоговую стоимость перед сборкой."],
          ].map(([emoji, title, text]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6">
              <span className="text-3xl" aria-hidden="true">
                {emoji}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </Container>
      </section>
    </>
  );
}
