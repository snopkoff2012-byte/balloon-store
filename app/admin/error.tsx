"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-6 text-center sm:p-8"
    >
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600">
        Данные не загрузились
      </p>
      <h1 className="mt-2 text-2xl font-black">Панель временно недоступна</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Проверьте интернет-соединение и повторите попытку. Данные в базе не
        изменились.
      </p>
      <button type="button" onClick={reset} className="admin-primary mt-5">
        Попробовать снова
      </button>
    </div>
  );
}
