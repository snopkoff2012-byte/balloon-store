import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PaymentAuthenticationError,
  PaymentConfigurationError,
  PaymentProviderNotActivatedError,
  PaymentRequestError,
} from "@/features/payments/errors";
import { createOrReusePaymentLink } from "@/features/payments/server-service";

const requestSchema = z.object({
  orderId: z.uuid(),
  provider: z.enum(["mock", "yookassa", "tbank"]),
  method: z.enum(["bank_card", "sbp"]),
  idempotencyKey: z.uuid(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные параметры создания ссылки на оплату." },
      { status: 400 },
    );
  }

  try {
    const payment = await createOrReusePaymentLink(parsed.data);
    return NextResponse.json(payment, { status: payment.reused ? 200 : 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось создать ссылку на оплату.";
    const status =
      error instanceof PaymentAuthenticationError
        ? 401
        : error instanceof PaymentConfigurationError ||
            error instanceof PaymentProviderNotActivatedError
          ? 503
          : error instanceof PaymentRequestError
            ? 409
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
