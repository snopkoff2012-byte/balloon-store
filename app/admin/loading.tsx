export default function AdminLoading() {
  return (
    <div aria-label="Загрузка административной панели" className="animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-slate-200" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-3xl bg-white" />
        ))}
      </div>
      <div className="mt-7 h-96 rounded-3xl bg-white" />
    </div>
  );
}
