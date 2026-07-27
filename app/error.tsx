"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-16 text-center">
      <div>
        <p className="text-6xl" aria-hidden="true">
          🛠️
        </p>
        <h1 className="mt-6 text-3xl font-black text-slate-950">
          Не удалось загрузить страницу
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
          Попробуйте повторить загрузку. Если ошибка останется, мы сможем
          проверить её по журналу приложения.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-2xl bg-rose-600 px-6 py-3 font-bold text-white hover:bg-rose-700"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
