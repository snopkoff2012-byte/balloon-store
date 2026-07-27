"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNavigation } from "@/lib/navigation";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
          <span className="h-0.5 w-full rounded-full bg-current" />
          <span className="h-0.5 w-full rounded-full bg-current" />
          <span className="h-0.5 w-full rounded-full bg-current" />
        </span>
      </button>
      {isOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-4 top-[4.75rem] z-50 rounded-3xl border border-rose-100 bg-white p-4 shadow-2xl shadow-rose-950/10"
        >
          <nav aria-label="Мобильная навигация" className="grid gap-1">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 font-medium text-slate-800 hover:bg-rose-50"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              Административная панель
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
