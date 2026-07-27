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
        className="inline-flex size-11 items-center justify-center rounded-full border border-[#ddd1d6] bg-white text-[#342631] transition hover:border-[#b88c9c] hover:bg-[#f9eff1] active:scale-95"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="relative block size-5" aria-hidden="true">
          <span
            className={`absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition ${
              isOpen ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition ${
              isOpen ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>
      {isOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-4 top-[4.7rem] z-50 overflow-hidden rounded-[1.75rem] border border-[#e5d9dd] bg-[#fffdfb] p-3 shadow-[0_24px_70px_rgba(66,35,48,0.18)]"
        >
          <nav aria-label="Мобильная навигация" className="grid gap-1">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3.5 text-base font-bold text-[#3f333c] transition hover:bg-[#f7e9ec] active:scale-[0.99]"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 rounded-2xl bg-[#342631] p-4 text-white">
            <p className="text-xs font-semibold text-white/60">
              Ежедневно, 09:00–21:00
            </p>
            <a
              href="tel:+74950000000"
              className="mt-1 block text-lg font-extrabold"
            >
              +7 (495) 000-00-00
            </a>
            <div className="mt-3 flex gap-2">
              <a
                href="https://t.me/balloon_moscow_demo"
                className="flex-1 rounded-full bg-white/10 px-3 py-2 text-center text-xs font-bold hover:bg-white/20"
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
              <a
                href="https://wa.me/74950000000"
                className="flex-1 rounded-full bg-white/10 px-3 py-2 text-center text-xs font-bold hover:bg-white/20"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
          <Link
            href="/admin"
            className="mt-2 block px-4 py-2 text-xs font-semibold text-[#9b8b93]"
            onClick={() => setIsOpen(false)}
          >
            Административная панель
          </Link>
        </div>
      ) : null}
    </div>
  );
}
