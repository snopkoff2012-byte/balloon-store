import "server-only";

import type {
  PaymentMethod,
  PaymentProviderCode,
  PaymentStatus,
} from "@/features/payments/contracts";
import {
  PaymentAuthenticationError,
  PaymentRequestError,
} from "@/features/payments/errors";
import {
  getPaymentProvider,
  getWebhookPaymentProvider,
} from "@/features/payments/factory";
import { createMoney } from "@/lib/money";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type PaymentRow = {
  id: string;
  public_token: string;
  order_id: string;
  provider: PaymentProviderCode;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  provider_status: string;
  amount_kopecks: number;
  currency: "RUB";
  external_id: string | null;
  confirmation_url: string | null;
  idempotency_key: string;
  test_mode: boolean;
  expires_at: string | null;
};

export type PaymentLinkResult = {
  paymentId: string;
  confirmationUrl: string;
  status: PaymentStatus;
  provider: PaymentProviderCode;
  method: PaymentMethod;
  testMode: boolean;
  reused: boolean;
};

async function requireAdminSession() {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    throw new PaymentAuthenticationError(
      "Для создания ссылки на оплату войдите в административную панель.",
    );
  }
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (profileError || !profile) {
    throw new PaymentAuthenticationError(
      "У вашей учётной записи нет доступа к оплате заказов.",
    );
  }
  return { supabase, userId };
}

function asPaymentRow(value: unknown) {
  return value as PaymentRow;
}

function paymentLinkResult(
  payment: PaymentRow,
  reused: boolean,
): PaymentLinkResult {
  if (!payment.confirmation_url) {
    throw new PaymentRequestError(
      "Ссылка уже создаётся. Обновите заказ через несколько секунд.",
    );
  }
  return {
    paymentId: payment.id,
    confirmationUrl: payment.confirmation_url,
    status: payment.status,
    provider: payment.provider,
    method: payment.payment_method,
    testMode: payment.test_mode,
    reused,
  };
}

export async function createOrReusePaymentLink(input: {
  orderId: string;
  provider: PaymentProviderCode;
  method: PaymentMethod;
  idempotencyKey: string;
}): Promise<PaymentLinkResult> {
  const { supabase, userId } = await requireAdminSession();
  const provider = getPaymentProvider(input.provider, input.method);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,order_number,public_token,status,total_kopecks,currency,delivery_price_pending",
    )
    .eq("id", input.orderId)
    .maybeSingle();
  if (orderError || !order) {
    throw new PaymentRequestError("Заказ не найден.");
  }
  if (!["confirmed", "awaiting_payment"].includes(String(order.status))) {
    throw new PaymentRequestError(
      "Сначала подтвердите заказ и сохраните его статус.",
    );
  }
  const amountKopecks = Number(order.total_kopecks);
  if (
    order.delivery_price_pending ||
    !Number.isSafeInteger(amountKopecks) ||
    amountKopecks <= 0
  ) {
    throw new PaymentRequestError(
      "Сначала подтвердите окончательную стоимость заказа и доставки.",
    );
  }

  const { data: idempotentPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (idempotentPayment) {
    const payment = asPaymentRow(idempotentPayment);
    if (payment.status !== "creating") return paymentLinkResult(payment, true);
  }

  const { data: activePayment, error: activeError } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", order.id)
    .in("status", ["creating", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeError) {
    throw new PaymentRequestError(
      "Не удалось проверить предыдущую попытку оплаты.",
    );
  }
  if (
    activePayment &&
    asPaymentRow(activePayment).idempotency_key !== input.idempotencyKey
  ) {
    return paymentLinkResult(asPaymentRow(activePayment), true);
  }

  let payment =
    idempotentPayment || activePayment
      ? asPaymentRow(idempotentPayment ?? activePayment)
      : null;
  if (!payment) {
    const newPayment = {
      id: crypto.randomUUID(),
      public_token: crypto.randomUUID(),
      order_id: order.id,
      provider: input.provider,
      payment_method: input.method,
      status: "creating",
      amount_kopecks: amountKopecks,
      currency: "RUB",
      idempotency_key: input.idempotencyKey,
      test_mode: provider.testMode,
      created_by: userId,
    };
    const { data: inserted, error: insertError } = await supabase
      .from("payments")
      .insert(newPayment)
      .select("*")
      .single();
    if (insertError || !inserted) {
      const { data: concurrentPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", order.id)
        .in("status", ["creating", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (concurrentPayment) {
        return paymentLinkResult(asPaymentRow(concurrentPayment), true);
      }
      throw new PaymentRequestError(
        "Не удалось зарезервировать попытку оплаты.",
      );
    }
    payment = asPaymentRow(inserted);
  }

  let providerCreated = false;
  try {
    const created = await provider.createPayment({
      paymentId: payment.id,
      paymentToken: payment.public_token,
      orderId: order.id,
      orderNumber: String(order.order_number),
      amount: createMoney(amountKopecks),
      method: input.method,
      description: `Заказ №${order.order_number} — Воздушная Москва`,
      returnUrl: `${String(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "")}/order/${order.public_token}/payment?returned=1`,
      idempotencyKey: input.idempotencyKey,
      testMode: provider.testMode,
    });
    providerCreated = true;

    const { data: updated, error: updateError } = await supabase
      .from("payments")
      .update({
        external_id: created.externalId,
        confirmation_url: created.confirmationUrl,
        status: created.status,
        provider_status: created.providerStatus,
        expires_at: created.expiresAt ?? null,
      })
      .eq("id", payment.id)
      .select("*")
      .single();
    if (updateError || !updated) {
      throw new PaymentRequestError(
        "Провайдер создал платёж, но ссылка не сохранилась. Не создавайте новую попытку до проверки журнала.",
      );
    }

    await supabase.from("payment_events").insert({
      payment_id: payment.id,
      order_id: order.id,
      provider: input.provider,
      provider_event_id: `internal:created:${payment.id}`,
      event_type: "payment_created",
      status_from: "creating",
      status_to: created.status,
      verified: true,
      test_mode: provider.testMode,
      safe_payload: {
        externalId: created.externalId,
        method: input.method,
      },
    });
    await supabase
      .from("orders")
      .update({
        status: "awaiting_payment",
        payment_status: "awaiting",
        payment_method: "online",
      })
      .eq("id", order.id);

    return paymentLinkResult(asPaymentRow(updated), false);
  } catch (error) {
    if (providerCreated) {
      throw error;
    }
    const message =
      error instanceof Error
        ? error.message
        : "Платёжный провайдер не создал ссылку.";
    await supabase
      .from("payments")
      .update({
        status: "failed",
        provider_status: "creation_failed",
        failure_code: "creation_failed",
        failure_message: message,
        failed_at: new Date().toISOString(),
      })
      .eq("id", payment.id);
    await supabase.from("payment_events").insert({
      payment_id: payment.id,
      order_id: order.id,
      provider: input.provider,
      provider_event_id: `internal:failed:${payment.id}`,
      event_type: "payment_creation_failed",
      status_from: "creating",
      status_to: "failed",
      verified: true,
      test_mode: provider.testMode,
      failure_code: "creation_failed",
      failure_message: message,
      safe_payload: { method: input.method },
    });
    throw error;
  }
}

export async function processPaymentWebhook(
  providerCode: PaymentProviderCode,
  request: Request,
) {
  const provider = getWebhookPaymentProvider(providerCode);
  const event = await provider.verifyWebhook(request);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.rpc(
    "apply_verified_payment_webhook",
    {
      input_provider: providerCode,
      input_external_id: event.externalId,
      input_event_id: event.eventId,
      input_status: event.status,
      input_provider_status: event.providerStatus,
      input_failure_code: event.failureCode ?? null,
      input_failure_message: event.failureMessage ?? null,
      input_safe_payload: event.safePayload,
    },
  );
  if (error) {
    if (error.message.includes("PAYMENT_NOT_FOUND")) {
      throw new PaymentRequestError(
        "Уведомление относится к неизвестному платежу.",
      );
    }
    throw new PaymentRequestError(
      "Не удалось применить проверенное уведомление об оплате.",
    );
  }
  const result = Array.isArray(data) ? data[0] : data;
  const webhookResult = {
    applied: Boolean(result?.applied),
    duplicate: Boolean(result?.duplicate),
  };
  return {
    result: webhookResult,
    response: provider.acknowledgeWebhook(webhookResult),
  };
}
