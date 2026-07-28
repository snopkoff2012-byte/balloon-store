import { NextResponse } from "next/server";
import {
  PaymentAuthenticationError,
  PaymentConfigurationError,
  PaymentRequestError,
} from "@/features/payments/errors";
import { processPaymentWebhook } from "@/features/payments/server-service";
import type { PaymentProviderCode } from "@/features/payments/contracts";

function isProvider(value: string): value is PaymentProviderCode {
  return ["mock", "yookassa", "tbank"].includes(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isProvider(provider)) {
    return NextResponse.json(
      { error: "Неизвестный платёжный провайдер." },
      { status: 404 },
    );
  }
  try {
    const processed = await processPaymentWebhook(provider, request);
    return processed.response;
  } catch (error) {
    const status =
      error instanceof PaymentAuthenticationError
        ? 401
        : error instanceof PaymentConfigurationError
          ? 503
          : error instanceof PaymentRequestError
            ? 404
            : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось обработать уведомление об оплате.",
      },
      { status },
    );
  }
}
