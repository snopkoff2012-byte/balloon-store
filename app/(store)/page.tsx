import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";
import { products } from "@/data/catalog";
import {
  benefits,
  completedOrders,
  faqItems,
  occasionCategories,
  reviews,
} from "@/data/home";

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b border-[#e8dfda]">
        <Container className="grid gap-10 py-8 sm:py-12 lg:min-h-[700px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14 lg:py-16">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dfcdd3] bg-white px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#8e2846] sm:text-xs">
              <span
                className="size-2 rounded-full bg-[#ef9d7f]"
                aria-hidden="true"
              />
              Принимаем заказы на сегодня
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-[3.05rem] leading-[0.98] tracking-[-0.045em] text-[#281d28] sm:text-6xl lg:text-[4.8rem]">
              Шары, которые
              <span className="block text-[#a42a4d]">создают настроение</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#6d5f68] sm:text-lg sm:leading-8">
              Современные композиции для важных моментов. Подберём палитру,
              соберём вручную и доставим точно ко времени по Москве и области.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/catalog" className="button-primary">
                Выбрать композицию
                <span aria-hidden="true">→</span>
              </Link>
              <a href="#contact" className="button-secondary">
                Написать менеджеру
              </a>
            </div>
            <dl className="mt-9 grid grid-cols-3 gap-3 border-t border-[#e2d7d2] pt-6">
              <div>
                <dt className="text-lg font-extrabold text-[#352831] sm:text-xl">
                  3+ дня
                </dt>
                <dd className="mt-1 text-[10px] leading-4 text-[#8a7b83] sm:text-xs">
                  держатся шары
                </dd>
              </div>
              <div>
                <dt className="text-lg font-extrabold text-[#352831] sm:text-xl">
                  60 мин
                </dt>
                <dd className="mt-1 text-[10px] leading-4 text-[#8a7b83] sm:text-xs">
                  быстрая сборка
                </dd>
              </div>
              <div>
                <dt className="text-lg font-extrabold text-[#352831] sm:text-xl">
                  7 дней
                </dt>
                <dd className="mt-1 text-[10px] leading-4 text-[#8a7b83] sm:text-xs">
                  работаем в неделю
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <BalloonPhotoPlaceholder
              variant="hero"
              className="aspect-[4/5] rounded-[2rem] sm:aspect-[5/4] lg:aspect-[4/5] lg:rounded-[2.5rem]"
              label="Заглушка большой фотографии ягодно-персиковой композиции из воздушных шаров"
            />
            <div className="absolute -left-2 top-8 rounded-2xl bg-[#342631] px-4 py-3 text-white shadow-xl shadow-[#342631]/15 sm:left-5 sm:top-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">
                Палитра недели
              </p>
              <p className="mt-1 text-sm font-extrabold">Ягоды и персик</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Популярные категории"
              title="Для каждого повода"
              description="Начните с события — внутри собраны готовые композиции, которые легко изменить под себя."
            />
            <Link
              href="/catalog"
              className="hidden shrink-0 text-sm font-extrabold text-[#8d2444] hover:text-[#651a33] sm:block"
            >
              Весь каталог →
            </Link>
          </div>
          <div className="-mx-4 mt-8 grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
            {occasionCategories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="interactive-card group flex min-h-44 snap-start flex-col justify-between rounded-[1.65rem] border border-[#e5dbd6] bg-white p-5 sm:min-h-48 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex size-12 items-center justify-center rounded-full ${category.tone} text-xs font-black text-[#4b3944]`}
                  >
                    {category.mark}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full border border-[#dfd3d7] text-[#8d2444] transition group-hover:bg-[#a42a4d] group-hover:text-white">
                    <span aria-hidden="true">↗</span>
                  </span>
                </div>
                <div className="mt-7">
                  <h3 className="text-lg font-extrabold tracking-[-0.02em] text-[#30242d]">
                    {category.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#7a6c74]">
                    {category.note}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/catalog"
            className="button-secondary mt-3 w-full sm:hidden"
          >
            Смотреть весь каталог
          </Link>
        </Container>
      </section>

      <section className="bg-[#f1ebe6] py-16 sm:py-24">
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Хиты продаж"
              title="Выбирают чаще всего"
              description="Проверенные сочетания оттенков и объёма. Любой набор можно адаптировать под ваш повод."
            />
            <Link
              href="/catalog"
              className="w-fit text-sm font-extrabold text-[#8d2444] hover:text-[#651a33]"
            >
              Все композиции →
            </Link>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                headingLevel="h3"
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="overflow-hidden rounded-[2rem] bg-[#342631] text-white sm:rounded-[2.75rem]">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-6 sm:p-10 lg:p-14">
                <SectionHeading
                  eyebrow="Индивидуальный заказ"
                  title="Соберите свою композицию"
                  description="Расскажите о событии, покажите референс или просто назовите любимые цвета. Менеджер предложит состав и рассчитает стоимость."
                  inverted
                />
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["01", "Повод и дата"],
                    ["02", "Цвета и бюджет"],
                    ["03", "Фото перед отправкой"],
                  ].map(([number, label]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-white/12 bg-white/5 p-4"
                    >
                      <span className="text-xs font-extrabold text-[#f2ad92]">
                        {number}
                      </span>
                      <p className="mt-2 text-sm font-bold text-white/86">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <a href="#contact" className="button-light mt-8 w-full sm:w-auto">
                  Обсудить идею
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="relative min-h-72 overflow-hidden bg-[#dcccd4] lg:min-h-full">
                <BalloonPhotoPlaceholder
                  variant="birthday"
                  compact
                  className="absolute inset-0"
                  label="Заглушка фотографии индивидуальной композиции"
                />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#fffaf7]/92 p-4 text-[#3b2d36] backdrop-blur sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-xs">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a2b4b]">
                    Можно изменить
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    Цвет, количество, надпись и упаковку
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-[#e7ddd8] bg-white py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Почему мы"
            title="Забота видна в деталях"
            description="Мы не просто надуваем шары — продумываем композицию целиком и остаёмся на связи до вручения."
          />
          <div className="mt-9 grid gap-px overflow-hidden rounded-[1.75rem] border border-[#e7ddd8] bg-[#e7ddd8] sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.number} className="bg-white p-6 sm:p-7">
                <span className="text-xs font-black text-[#a42a4d]">
                  {benefit.number}
                </span>
                <h3 className="mt-8 text-lg font-extrabold leading-6 text-[#342831]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#776a72]">
                  {benefit.text}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Доставка"
              title="Москва и область — каждый день"
              description="Подбираем автомобиль под объём композиции, защищаем шары от погоды и заранее согласуем интервал."
            />
            <div className="mt-7 grid gap-3">
              <div className="flex gap-4 rounded-2xl border border-[#e5dbd6] bg-white p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f1dfd5] text-xs font-black">
                  М
                </span>
                <div>
                  <h3 className="font-extrabold text-[#342831]">По Москве</h3>
                  <p className="mt-1 text-sm leading-6 text-[#776a72]">
                    Точную стоимость назовём после адреса и размера заказа.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl border border-[#e5dbd6] bg-white p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ded8ea] text-xs font-black">
                  МО
                </span>
                <div>
                  <h3 className="font-extrabold text-[#342831]">
                    По Московской области
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#776a72]">
                    Рассчитаем маршрут заранее и подтвердим время прибытия.
                  </p>
                </div>
              </div>
            </div>
            <Link href="/delivery" className="button-secondary mt-6">
              Подробнее о доставке
            </Link>
          </div>
          <div className="relative min-h-96 overflow-hidden rounded-[2rem] bg-[#d8d0c8] p-5 sm:p-8">
            <div className="absolute left-[12%] top-[18%] size-48 rounded-full border border-white/80 sm:size-64" />
            <div className="absolute right-[8%] top-[8%] size-64 rounded-full border border-white/65 sm:size-80" />
            <div className="absolute bottom-[3%] left-[22%] size-56 rounded-full border border-white/50 sm:size-72" />
            <div className="relative z-10 flex h-full min-h-80 flex-col justify-between rounded-[1.5rem] bg-[#fbf8f4]/88 p-5 backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#8f7f87]">
                  Зона доставки
                </p>
                <span className="size-3 rounded-full bg-[#a42a4d]" />
              </div>
              <div>
                <p className="font-display text-4xl leading-tight text-[#342831] sm:text-5xl">
                  От центра
                  <br />
                  до вашего дома
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Москва", "Химки", "Одинцово", "Красногорск", "Мытищи"].map(
                    (city) => (
                      <span
                        key={city}
                        className="rounded-full border border-[#d9cdd1] bg-white px-3 py-2 text-xs font-bold text-[#62545d]"
                      >
                        {city}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#f1ebe6] py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Наши работы"
            title="Недавние заказы"
            description="Пока здесь используются локальные визуальные заглушки. Позже их заменят реальные фотографии выполненных композиций."
          />
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-5">
            {completedOrders.map((order, index) => (
              <article
                key={order.title}
                className={`group overflow-hidden rounded-[1.5rem] bg-white sm:rounded-[2rem] ${
                  index === 0 || index === 3 ? "sm:row-span-2" : ""
                }`}
              >
                <BalloonPhotoPlaceholder
                  variant={order.variant}
                  compact
                  className={`${
                    index === 0 || index === 3
                      ? "aspect-[4/5]"
                      : "aspect-square sm:aspect-[8/5]"
                  } transition duration-500 group-hover:scale-[1.02]`}
                  label={`Заглушка фотографии заказа «${order.title}»`}
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-sm font-extrabold text-[#342831] sm:text-lg">
                    {order.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-[#81737b] sm:text-sm">
                    {order.note}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="reviews" className="scroll-mt-28 py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Отзывы"
            title="Слова после праздника"
            description="Тестовые отзывы показывают будущий формат блока. Реальные отзывы будут добавляться с согласия клиентов."
          />
          <div className="-mx-4 mt-9 grid auto-cols-[88%] grid-flow-col gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:px-0">
            {reviews.map((review) => (
              <figure
                key={review.name}
                className="flex min-h-72 snap-start flex-col justify-between rounded-[1.75rem] border border-[#e5dbd6] bg-white p-6"
              >
                <div>
                  <div
                    className="text-4xl font-display text-[#d8a0b0]"
                    aria-hidden="true"
                  >
                    “
                  </div>
                  <blockquote className="mt-3 text-[15px] leading-7 text-[#564850]">
                    {review.text}
                  </blockquote>
                </div>
                <figcaption className="mt-7 flex items-center gap-3 border-t border-[#eee6e2] pt-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#ead9df] text-sm font-extrabold text-[#7c2742]">
                    {review.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-[#342831]">
                      {review.name}
                    </span>
                    <span className="block text-xs text-[#8b7c84]">
                      {review.event}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      <section id="faq" className="scroll-mt-28 border-y border-[#e7ddd8] bg-white py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Вопросы и ответы"
              title="Всё важное до заказа"
              description="Если не нашли ответ, напишите менеджеру — ответим быстро и без сложных формулировок."
            />
            <a href="#contact" className="button-secondary mt-7 hidden lg:inline-flex">
              Задать свой вопрос
            </a>
          </div>
          <div className="border-t border-[#e7ddd8]">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group border-b border-[#e7ddd8]"
              >
                <summary className="flex min-h-18 items-center justify-between gap-5 py-5 text-left text-base font-extrabold text-[#342831] transition hover:text-[#8d2444] sm:text-lg">
                  {item.question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d9cdd1] text-lg font-normal transition group-open:rotate-45 group-open:bg-[#a42a4d] group-open:text-white">
                    <span aria-hidden="true">+</span>
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-[#756770] sm:text-base">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section id="contact" className="scroll-mt-28 py-16 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#a42a4d] px-6 py-10 text-white sm:rounded-[2.75rem] sm:px-12 sm:py-14 lg:px-16">
            <div
              className="absolute -right-24 -top-32 size-80 rounded-full border-[55px] border-white/8"
              aria-hidden="true"
            />
            <div className="relative z-10 grid gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f7c4b1]">
                  Остаёмся на связи
                </p>
                <h2 className="mt-4 font-display text-[2.35rem] leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                  Расскажите, какой праздник вы задумали
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
                  Напишите в удобный мессенджер или позвоните. Поможем собрать
                  композицию, рассчитаем доставку и зафиксируем время.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-96 lg:grid-cols-1">
                <a
                  href="https://t.me/balloon_moscow_demo"
                  className="button-light"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#dcecf5] text-[10px] font-black text-[#3179a4]">
                    TG
                  </span>
                  Написать в Telegram
                </a>
                <a
                  href="https://wa.me/74950000000"
                  className="button-light"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#dcf2e4] text-[10px] font-black text-[#36835a]">
                    WA
                  </span>
                  Написать в WhatsApp
                </a>
              </div>
            </div>
            <div className="relative z-10 mt-8 flex flex-col gap-2 border-t border-white/18 pt-6 text-sm text-white/72 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="tel:+74950000000"
                className="text-lg font-extrabold text-white hover:text-[#ffd5c5]"
              >
                +7 (495) 000-00-00
              </a>
              <p>На связи ежедневно, 09:00–21:00</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
