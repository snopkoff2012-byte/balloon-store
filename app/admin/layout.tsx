import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <Container className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/admin" className="font-bold">
            Воздушная Москва · Управление
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Вернуться в магазин
          </Link>
        </Container>
      </header>
      <main>
        <Container className="py-10">{children}</Container>
      </main>
    </div>
  );
}
