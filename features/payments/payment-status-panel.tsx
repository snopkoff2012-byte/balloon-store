"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessengerButtons } from "@/components/messengers/messenger-buttons";

type PaymentSummary = {
  order_number: number;
  payment_status:
    | "not_created"
    | "creating"
    | "pending"
    | "succeeded"
    | "canceled"
    | "failed"
    | "refunded";
  provider: string | null;
  payment_method: string | null;
  test_mode: boolean;
  updated_at: string | null;
};

const statusText: Record<PaymentSummary["payment_status"], string> = {
  not_created: "Ссылка на оплату ещё не создана. Менеджер пришлёт её после подтверждения заказа.",
  creating: "Ссылка создаётся. Обновите страницу через несколько секунд.",
  pending: "Провайдер ещё не подтвердил оплату. Страница обновится автоматически.",
  succeeded: "Оплата подтверждена уведомлением платёжного провайдера.",
  canceled: "Платёж отменён. Менеджер может отправить новую ссылку.",
  failed: "Платёж не прошёл. Менеджер может отправить новую ссылку.",
  refunded: "По этому платежу оформлен возврат.",
};

export function PaymentStatusPanel({
  token,
  returnedFromProvider,
}: {
  token: string;
  returnedFromProvider: boolean;
}) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const response = await fetch(
          `/api/payments/status?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const body = (await response.json()) as PaymentSummary & {
          error?: string;
        };
        if (!response.ok) throw new Error(body.error);
        if (stopped) return;
        setSummary(body);
        setError("");
        if (["creating", "pending"].includes(body.payment_status)) {
          timer = setTimeout(load, 4000);
        }
      } catch (reason) {
        if (!stopped) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Не удалось проверить оплату.",
          );
        }
      }
    }
    void load();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  const successful = summary?.payment_status === "succeeded";
  const message = `Здравствуйте! Хочу уточнить оплату заказа №${summary?.order_number ?? ""}.`;

  return (
    <section
      className={`rounded-[1.75rem] border p-8 ${
        successful
          ? "border-[#bdd8c8] bg-[#edf7f0]"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <p className="text-4xl" aria-hidden="true">
        {successful ? "✓" : "⌛"}
      </p>
      <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-[#3f6a50]">
        Статус оплаты
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#244532]">
        {summary?.order_number
          ? `Заказ №${summary.order_number}`
          : "Проверяем заказ"}
      </h1>
      {returnedFromProvider ? (
        <p className="mt-4 rounded-xl bg-white/70 p-3 text-sm font-semibold text-slate-700">
          Возврат на эту страницу не подтверждает оплату. Мы показываем только
          статус, полученный сервером через проверенный webhook.
        </p>
      ) : null}
      <p className="mt-4 max-w-xl leading-7 text-[#3f6a50]">
        {error ||
          (summary
            ? statusText[summary.payment_status]
            : "Получаем подтверждённый статус…")}
      </p>
      {summary?.test_mode ? (
        <p className="mt-3 text-sm font-bold text-amber-800">
          Тестовый режим: реальные деньги не списываются.
        </p>
      ) : null}
      <MessengerButtons className="mt-6 max-w-md" message={message} />
      <Link href="/catalog" className="button-primary mt-4">
        Вернуться в каталог
      </Link>
    </section>
  );
}
