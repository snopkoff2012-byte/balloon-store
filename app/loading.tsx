import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="min-h-[70vh] py-10 sm:py-16"
      role="status"
      aria-live="polite"
    >
      <Container>
        <span className="sr-only">Загружаем страницу…</span>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-6 h-14 w-full max-w-lg sm:h-20" />
            <Skeleton className="mt-4 h-14 w-4/5 max-w-md" />
            <Skeleton className="mt-7 h-5 w-full max-w-xl" />
            <Skeleton className="mt-3 h-5 w-3/4 max-w-lg" />
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-13 w-44 rounded-full" />
              <Skeleton className="h-13 w-44 rounded-full" />
            </div>
          </div>
          <Skeleton className="aspect-[4/5] w-full rounded-[2rem] sm:aspect-[5/4] lg:aspect-[4/5]" />
        </div>
      </Container>
    </div>
  );
}
