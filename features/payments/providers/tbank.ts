import type {
  CreatedPayment,
  PaymentProvider,
  PaymentStatus,
  VerifiedPaymentWebhook,
} from "@/features/payments/contracts";
import { PaymentProviderNotActivatedError } from "@/features/payments/errors";

export type TBankAdapterConfig = {
  terminalKey: string;
  password: string;
  testMode: boolean;
};

/**
 * Точка расширения для интернет-эквайринга Т-Банка.
 *
 * Перед активацией здесь нужно реализовать Init для bank_card/SBP, вычисление
 * Token по правилам Т-Банка и проверку Token каждого уведомления. До отдельного
 * интеграционного тестирования адаптер намеренно не выполняет сетевые запросы.
 */
export class TBankPaymentProvider implements PaymentProvider {
  readonly code = "tbank" as const;
  readonly testMode: boolean;

  constructor(private readonly config: TBankAdapterConfig) {
    this.testMode = config.testMode;
  }

  async createPayment(): Promise<CreatedPayment> {
    void this.config;
    throw new PaymentProviderNotActivatedError("Т-Банк");
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    throw new PaymentProviderNotActivatedError("Т-Банк");
  }

  async verifyWebhook(): Promise<VerifiedPaymentWebhook> {
    throw new PaymentProviderNotActivatedError("Т-Банк");
  }

  acknowledgeWebhook() {
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
