import { NextResponse } from "next/server";
import { z } from "zod";
import { getWebhookPaymentProvider } from "@/features/payments/factory";
import { MockPaymentProvider } from "@/features/payments/providers/mock";
import { processPaymentWebhook } from "@/features/payments/server-service";
import { getPublicEnvironment } from "@/lib/environment";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const formSchema = z.object({
  paymentToken: z.uuid(),
  outcome: z.enum(["succeeded", "canceled", "failed"]),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = formSchema.safeParse({
    paymentToken: formData.get("paymentToken"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректный тестовый платёж." },
      { status: 400 },
    );
  }

  try {
    const provider = getWebhookPaymentProvider("mock");
    if (!(provider instanceof MockPaymentProvider)) {
      throw new Error("MockPaymentProvider не включён.");
    }
    const supabase = createServiceRoleSupabaseClient();
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("external_id,order_id,status")
      .eq("public_token", parsed.data.paymentToken)
      .eq("provider", "mock")
      .eq("test_mode", true)
      .maybeSingle();
    if (paymentError || !payment?.external_id) {
      return NextResponse.json(
        { error: "Тестовый платёж не найден." },
        { status: 404 },
      );
    }
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("public_token")
      .eq("id", payment.order_id)
      .single();
    if (orderError || !order) {
      return NextResponse.json(
        { error: "Заказ тестового платежа не найден." },
        { status: 404 },
      );
    }

    if (!["succeeded", "canceled", "failed", "refunded"].includes(payment.status)) {
      const rawBody = provider.createTestWebhookBody(
        payment.external_id,
        parsed.data.outcome,
      );
      const signature = await provider.signTestWebhook(rawBody);
      const webhookRequest = new Request(
        new URL("/api/payments/webhooks/mock", request.url),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-payment-signature": signature,
          },
          body: rawBody,
        },
      );
      await processPaymentWebhook("mock", webhookRequest);
    }

    const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL.replace(
      /\/$/,
      "",
    );
    return NextResponse.redirect(
      `${siteUrl}/order/${order.public_token}/payment?returned=1`,
      303,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось завершить тестовую оплату.",
      },
      { status: 503 },
    );
  }
}
