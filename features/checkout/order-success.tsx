"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

type Summary = { order_number: number; status: string; total_kopecks: number; requested_delivery_date: string | null; requested_delivery_slot: string | null; fulfillment_method: "delivery" | "pickup" };

export function OrderSuccess({ token, fallbackNumber, fallbackTotal }: { token: string; fallbackNumber?: number; fallbackTotal?: number }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/orders/summary?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setSummary(data);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить заказ."));
  }, [token]);

  if (error) return <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-8"><h1 className="text-2xl font-extrabold text-amber-950">Заказ{fallbackNumber ? ` №${fallbackNumber}` : ""} создан</h1><p className="mt-3 text-amber-900">{fallbackTotal ? `Итог: ${formatMoney({ amountKopecks: fallbackTotal, currency: "RUB" })}. ` : ""}{error} Сохраните ссылку на эту страницу или обратитесь к менеджеру.</p><Link href="/catalog" className="button-primary mt-6">Вернуться в каталог</Link></section>;
  if (!summary) return <section className="h-64 animate-pulse rounded-[1.75rem] bg-[#eee5e0]" aria-label="Загрузка заказа" />;
  return <section className="rounded-[1.75rem] border border-[#bdd8c8] bg-[#edf7f0] p-8"><p className="text-4xl" aria-hidden="true">✓</p><p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-[#3f6a50]">Заказ принят</p><h1 className="mt-2 text-3xl font-extrabold text-[#244532]">Заказ №{summary.order_number}</h1><p className="mt-3 max-w-xl leading-7 text-[#3f6a50]">Мы зафиксировали состав и итоговую стоимость: {formatMoney({ amountKopecks: summary.total_kopecks, currency: "RUB" })}. Менеджер свяжется с вами для подтверждения деталей.</p><dl className="mt-6 grid gap-3 rounded-2xl bg-white/70 p-4 text-sm text-[#3f6a50]"><div className="flex justify-between gap-4"><dt>Получение</dt><dd className="font-bold">{summary.fulfillment_method === "pickup" ? "Самовывоз" : "Доставка"}</dd></div>{summary.requested_delivery_date ? <div className="flex justify-between gap-4"><dt>Дата и время</dt><dd className="font-bold">{new Date(`${summary.requested_delivery_date}T00:00:00`).toLocaleDateString("ru-RU")} · {summary.requested_delivery_slot}</dd></div> : null}</dl><Link href="/catalog" className="button-primary mt-6">Вернуться в каталог</Link></section>;
}
