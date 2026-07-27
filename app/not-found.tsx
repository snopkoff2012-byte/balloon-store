import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-rose-50 px-5 py-16 text-center">
      <div>
        <p className="text-7xl" aria-hidden="true">
          🎈
        </p>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-rose-600">
          Ошибка 404
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600">
          Возможно, адрес изменился или такой страницы ещё нет.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800"
        >
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
}
