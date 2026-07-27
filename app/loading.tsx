export default function Loading() {
  return (
    <div
      className="grid min-h-[60vh] place-items-center px-5 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <span className="inline-block animate-bounce text-6xl" aria-hidden="true">
          🎈
        </span>
        <p className="mt-4 font-semibold text-slate-700">Загружаем страницу…</p>
      </div>
    </div>
  );
}
