import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { formatMoney } from "@/lib/money";
import { getOptionalPublicEnvironment } from "@/lib/environment";

export const metadata: Metadata = {
  title: "Тестовая оплата",
  robots: { index: false, follow: false },
};

export default async function MockPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const environment = getOptionalPublicEnvironment();
  if (!environment) notFound();
  const supabase = createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await supabase.rpc("get_mock_payment_checkout", {
    payment_token: token,
  });
  const payment = Array.isArray(data) ? data[0] : data;
  if (error || !payment) notFound();

  const terminal = ["succeeded", "canceled", "failed", "refunded"].includes(
    String(payment.payment_status),
  );

  return (
    <Container className="py-10 sm:py-16">
      <section className="mx-auto max-w-xl rounded-[1.75rem] border border-violet-200 bg-violet-50 p-7 sm:p-9">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">
          MockPaymentProvider
        </p>
        <h1 className="mt-2 text-3xl font-black">
          Тестовая оплата заказа №{payment.order_number}
        </h1>
        <p className="mt-4 text-lg font-bold">
          {formatMoney({
            amountKopecks: Number(payment.amount_kopecks),
            currency: "RUB",
          })}
        </p>
        <p className="mt-3 leading-7 text-slate-600">
          Это имитация платёжной страницы. Реквизиты карты не запрашиваются,
          реальные деньги не списываются.
        </p>
        {terminal ? (
          <p className="mt-5 rounded-xl bg-white p-4 font-semibold">
            Тест завершён со статусом: {String(payment.payment_status)}.
          </p>
        ) : (
          <form
            method="post"
            action="/api/payments/mock/complete"
            className="mt-6 grid gap-3"
          >
            <input type="hidden" name="paymentToken" value={token} />
            <button
              className="button-primary"
              type="submit"
              name="outcome"
              value="succeeded"
            >
              Имитировать успешную оплату
            </button>
            <button
              className="rounded-xl border border-amber-300 bg-white px-4 py-3 font-bold text-amber-800"
              type="submit"
              name="outcome"
              value="canceled"
            >
              Имитировать отмену
            </button>
            <button
              className="rounded-xl border border-red-300 bg-white px-4 py-3 font-bold text-red-700"
              type="submit"
              name="outcome"
              value="failed"
            >
              Имитировать неудачный платёж
            </button>
          </form>
        )}
        <Link
          href={`/order/${payment.order_token}/payment`}
          className="mt-5 inline-block text-sm font-bold text-violet-800 underline"
        >
          Открыть подтверждённый статус
        </Link>
      </section>
    </Container>
  );
}
