import {
  constantTimeEqual,
  hmacSha256Hex,
  sha256Hex,
} from "@/features/payments/crypto";
import {
  type CreatedPayment,
  type CreatePaymentInput,
  type PaymentProvider,
  type PaymentStatus,
  type PaymentWebhookResult,
  type VerifiedPaymentWebhook,
} from "@/features/payments/contracts";
import { PaymentAuthenticationError } from "@/features/payments/errors";

type MockWebhookBody = {
  eventId: string;
  externalId: string;
  status: "pending" | "succeeded" | "canceled" | "failed" | "refunded";
  occurredAt: string;
  failureCode?: string;
  failureMessage?: string;
};

function isMockWebhookBody(value: unknown): value is MockWebhookBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<MockWebhookBody>;
  return (
    typeof body.eventId === "string" &&
    typeof body.externalId === "string" &&
    typeof body.occurredAt === "string" &&
    ["pending", "succeeded", "canceled", "failed", "refunded"].includes(
      String(body.status),
    )
  );
}

export class MockPaymentProvider implements PaymentProvider {
  readonly code = "mock" as const;
  readonly testMode = true;

  constructor(
    private readonly siteUrl: string,
    private readonly webhookSecret: string,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const digest = await sha256Hex(input.idempotencyKey);
    const externalId = `mock_${digest.slice(0, 32)}`;
    return {
      externalId,
      confirmationUrl: `${this.siteUrl}/payment/mock/${input.paymentToken}`,
      status: "pending",
      providerStatus: "mock_pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return "pending";
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentWebhook> {
    const rawBody = await request.text();
    const providedSignature =
      request.headers.get("x-payment-signature")?.toLowerCase() ?? "";
    const expectedSignature = await this.signTestWebhook(rawBody);

    if (
      !providedSignature ||
      !constantTimeEqual(providedSignature, expectedSignature)
    ) {
      throw new PaymentAuthenticationError();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new PaymentAuthenticationError(
        "Уведомление об оплате содержит некорректный JSON.",
      );
    }
    if (!isMockWebhookBody(parsed)) {
      throw new PaymentAuthenticationError(
        "Уведомление об оплате имеет неверный формат.",
      );
    }

    return {
      eventId: parsed.eventId,
      externalId: parsed.externalId,
      status: parsed.status,
      providerStatus: `mock_${parsed.status}`,
      occurredAt: parsed.occurredAt,
      failureCode: parsed.failureCode ?? null,
      failureMessage: parsed.failureMessage ?? null,
      safePayload: {
        eventId: parsed.eventId,
        externalId: parsed.externalId,
        status: parsed.status,
      },
    };
  }

  signTestWebhook(rawBody: string) {
    return hmacSha256Hex(this.webhookSecret, rawBody);
  }

  createTestWebhookBody(
    externalId: string,
    status: MockWebhookBody["status"],
  ) {
    return JSON.stringify({
      eventId: crypto.randomUUID(),
      externalId,
      status,
      occurredAt: new Date().toISOString(),
      failureCode: status === "failed" ? "mock_declined" : undefined,
      failureMessage:
        status === "failed" ? "Тестовая имитация отклонённой оплаты." : undefined,
    } satisfies MockWebhookBody);
  }

  acknowledgeWebhook(result: PaymentWebhookResult) {
    return Response.json({ ok: true, ...result });
  }
}
