import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
  return (
    <div className="mt-8" role="status" aria-live="polite">
      <span className="sr-only">Загружаем каталог…</span>
      <div className="grid gap-3 sm:grid-cols-4">
        <Skeleton className="h-12 sm:col-span-2" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.75rem] border border-[#e6ddd8] bg-white"
          >
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-6 h-8 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
