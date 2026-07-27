import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Административная панель",
  robots: { index: false, follow: false },
};

const stats = [
  { label: "Товаров", value: "6" },
  { label: "Категорий", value: "4" },
  { label: "Новых заказов", value: "0" },
];

export default function AdminPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
            Демонстрационный режим
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Административная панель
          </h1>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
          Авторизация будет подключена с Supabase
        </span>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {stat.value}
            </p>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-950">Разделы управления</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Категории и подкатегории",
            "Товары и фотографии",
            "Характеристики",
            "Заказы и статусы",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 font-medium text-slate-700"
            >
              {item}
              <span className="mt-1 block text-sm font-normal text-slate-500">
                Будет доступно после подключения базы
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
