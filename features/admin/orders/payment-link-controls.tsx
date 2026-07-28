"use client";

import { useState } from "react";
import type {
  PaymentMethod,
  PaymentProviderCode,
} from "@/features/payments/contracts";

type PaymentLinkResponse = {
  confirmationUrl: string;
  status: string;
  provider: PaymentProviderCode;
  method: PaymentMethod;
  testMode: boolean;
  reused: boolean;
};

export function PaymentLinkControls({
  orderId,
  orderStatus,
  totalKopecks,
}: {
  orderId: string;
  orderStatus: string;
  totalKopecks: number | null;
}) {
  const [provider, setProvider] = useState<PaymentProviderCode>("mock");
  const [method, setMethod] = useState<PaymentMethod>("bank_card");
  const [paymentLink, setPaymentLink] = useState("");
  const [notice, setNotice] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const canCreate =
    ["confirmed", "awaiting_payment"].includes(orderStatus) &&
    totalKopecks !== null &&
    totalKopecks > 0;

  async function createLink() {
    setIsCreating(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          provider,
          method,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | PaymentLinkResponse
        | { error?: string }
        | null;
      if (!response.ok || !body || !("confirmationUrl" in body)) {
        throw new Error(
          body && "error" in body && body.error
            ? body.error
            : "Не удалось создать ссылку на оплату.",
        );
      }
      setPaymentLink(body.confirmationUrl);
      setNotice(
        body.reused
          ? "Действующая ссылка найдена. Её можно снова отправить клиенту."
          : body.testMode
            ? "Создана тестовая ссылка. Деньги по ней не списываются."
            : "Ссылка создана. Проверьте её в тестовом сценарии перед отправкой клиенту.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Не удалось создать ссылку на оплату.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setNotice("Ссылка скопирована. Её можно отправить клиенту.");
    } catch {
      setNotice("Не удалось скопировать автоматически. Скопируйте ссылку из поля.");
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="font-black">Ссылка на онлайн-оплату</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Сумма берётся из сохранённого заказа. Активная ссылка возвращается
        повторно; новая попытка создаётся только после отмены или ошибки.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">
          Провайдер
          <select
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as PaymentProviderCode)
            }
            className="admin-input mt-1"
          >
            <option value="mock">Тестовый Mock</option>
            <option value="yookassa">ЮKassa</option>
            <option value="tbank">Т-Банк</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">
          Способ
          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as PaymentMethod)
            }
            className="admin-input mt-1"
          >
            <option value="bank_card">Банковская карта</option>
            <option value="sbp">СБП</option>
          </select>
        </label>
      </div>
      {!canCreate ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          Сначала сохраните окончательную сумму и статус «Подтверждён».
        </p>
      ) : null}
      <button
        type="button"
        disabled={!canCreate || isCreating}
        onClick={createLink}
        className="admin-primary mt-4"
      >
        {isCreating ? "Создаём…" : "Получить или создать ссылку"}
      </button>
      {paymentLink ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={paymentLink}
            aria-label="Ссылка на оплату"
            className="admin-input min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Скопировать
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className="mt-3 text-xs font-semibold text-slate-700" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
