"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessengerButtons } from "@/components/messengers/messenger-buttons";
import { formatMoney } from "@/lib/money";

type Summary = {
  order_number: number;
  items_total_kopecks: number;
  delivery_price_pending: boolean;
  total_kopecks: number | null;
};

export function OrderSuccess({ token, fallbackNumber, fallbackTotal, fallbackDeliveryPending = false }: { token: string; fallbackNumber?: number; fallbackTotal?: number; fallbackDeliveryPending?: boolean }) {
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

  const number = summary?.order_number ?? fallbackNumber;
  const total = summary?.total_kopecks ?? fallbackTotal;
  const deliveryPending = summary?.delivery_price_pending ?? fallbackDeliveryPending;
  const message = `Здравствуйте! Заказ №${number ?? ""} оформлен. Хочу уточнить детали.`;

  if (!summary && !error) return <section className="h-64 animate-pulse rounded-[1.75rem] bg-[#eee5e0]" aria-label="Загрузка заказа" />;

  return <section className={`rounded-[1.75rem] border p-8 ${error ? "border-amber-200 bg-amber-50" : "border-[#bdd8c8] bg-[#edf7f0]"}`}>
    <p className="text-4xl" aria-hidden="true">{error ? "!" : "✓"}</p>
    <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-[#3f6a50]">Заказ принят</p>
    <h1 className="mt-2 text-3xl font-extrabold text-[#244532]">Заказ{number ? ` №${number}` : ""}</h1>
    <p className="mt-3 max-w-xl leading-7 text-[#3f6a50]">
      {total ? `${deliveryPending ? "Товары без доставки" : "Итог"}: ${formatMoney({ amountKopecks: total, currency: "RUB" })}. ` : ""}
      {deliveryPending ? "Стоимость доставки уточнит менеджер. " : ""}
      {error || "Менеджер свяжется с вами для подтверждения деталей."}
    </p>
    <MessengerButtons className="mt-6 max-w-md" message={message} />
    <Link href="/catalog" className="button-primary mt-4">Вернуться в каталог</Link>
  </section>;
}
