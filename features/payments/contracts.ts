import type { Money } from "@/lib/money";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amount: Money;
  returnUrl: string;
  idempotencyKey: string;
};

export type CreatedPayment = {
  externalId: string;
  confirmationUrl: string;
  status: PaymentStatus;
};

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;
  getPaymentStatus(externalId: string): Promise<PaymentStatus>;
  verifyWebhook(request: Request): Promise<boolean>;
}
