import type {
  CreatedPayment,
  PaymentProvider,
  PaymentStatus,
  PaymentWebhookResult,
  VerifiedPaymentWebhook,
} from "@/features/payments/contracts";
import { PaymentProviderNotActivatedError } from "@/features/payments/errors";

export type YooKassaAdapterConfig = {
  shopId: string;
  secretKey: string;
  testMode: boolean;
};

/**
 * Точка расширения для ЮKassa.
 *
 * Перед активацией здесь нужно реализовать создание платежа с ключом
 * идемпотентности, выбор bank_card/sbp и проверку webhook повторным запросом
 * статуса платежа в API ЮKassa. До отдельного интеграционного тестирования
 * адаптер намеренно не выполняет сетевые запросы.
 */
export class YooKassaPaymentProvider implements PaymentProvider {
  readonly code = "yookassa" as const;
  readonly testMode: boolean;

  constructor(private readonly config: YooKassaAdapterConfig) {
    this.testMode = config.testMode;
  }

  async createPayment(): Promise<CreatedPayment> {
    void this.config;
    throw new PaymentProviderNotActivatedError("ЮKassa");
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    throw new PaymentProviderNotActivatedError("ЮKassa");
  }

  async verifyWebhook(): Promise<VerifiedPaymentWebhook> {
    throw new PaymentProviderNotActivatedError("ЮKassa");
  }

  acknowledgeWebhook(result: PaymentWebhookResult) {
    return Response.json({ ok: true, ...result });
  }
}
