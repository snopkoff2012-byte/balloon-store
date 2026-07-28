import type { Money } from "@/lib/money";

export type PaymentProviderCode = "mock" | "yookassa" | "tbank";
export type PaymentMethod = "bank_card" | "sbp";
export type PaymentStatus =
  | "creating"
  | "pending"
  | "succeeded"
  | "canceled"
  | "failed"
  | "refunded";

export type CreatePaymentInput = {
  paymentId: string;
  paymentToken: string;
  orderId: string;
  orderNumber: string;
  amount: Money;
  method: PaymentMethod;
  description: string;
  returnUrl: string;
  idempotencyKey: string;
  testMode: boolean;
};

export type CreatedPayment = {
  externalId: string;
  confirmationUrl: string;
  status: PaymentStatus;
  providerStatus: string;
  expiresAt?: string | null;
};

export type VerifiedPaymentWebhook = {
  eventId: string;
  externalId: string;
  status: Exclude<PaymentStatus, "creating">;
  providerStatus: string;
  occurredAt: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  safePayload: Record<string, unknown>;
};

export type PaymentWebhookResult = {
  applied: boolean;
  duplicate: boolean;
};

export interface PaymentProvider {
  readonly code: PaymentProviderCode;
  readonly testMode: boolean;

  createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;
  getPaymentStatus(externalId: string): Promise<PaymentStatus>;
  verifyWebhook(request: Request): Promise<VerifiedPaymentWebhook>;
  acknowledgeWebhook(result: PaymentWebhookResult): Response;
}
