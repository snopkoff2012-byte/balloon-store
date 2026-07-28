import "server-only";

import type {
  PaymentMethod,
  PaymentProvider,
  PaymentProviderCode,
} from "@/features/payments/contracts";
import { PaymentConfigurationError } from "@/features/payments/errors";
import { MockPaymentProvider } from "@/features/payments/providers/mock";
import { TBankPaymentProvider } from "@/features/payments/providers/tbank";
import { YooKassaPaymentProvider } from "@/features/payments/providers/yookassa";
import { getPublicEnvironment } from "@/lib/environment";

export type PaymentMode = "disabled" | "mock" | "test" | "live";

function paymentMode(): PaymentMode {
  const value = process.env.PAYMENT_MODE ?? "disabled";
  if (!["disabled", "mock", "test", "live"].includes(value)) {
    throw new PaymentConfigurationError(
      "PAYMENT_MODE должен быть disabled, mock, test или live.",
    );
  }
  return value as PaymentMode;
}

function configuredProvider(
  method: PaymentMethod,
): PaymentProviderCode | undefined {
  const value =
    method === "sbp"
      ? process.env.PAYMENT_SBP_PROVIDER
      : process.env.PAYMENT_DEFAULT_PROVIDER;
  if (!value) return undefined;
  if (!["mock", "yookassa", "tbank"].includes(value)) {
    throw new PaymentConfigurationError(
      "Платёжный провайдер должен быть mock, yookassa или tbank.",
    );
  }
  return value as PaymentProviderCode;
}

function requiredSecret(name: string) {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith("your-")) {
    throw new PaymentConfigurationError(
      `Не задана серверная переменная ${name}.`,
    );
  }
  return value;
}

export function getPaymentProvider(
  requestedProvider: PaymentProviderCode,
  method: PaymentMethod,
): PaymentProvider {
  const mode = paymentMode();
  if (mode === "disabled") {
    throw new PaymentConfigurationError(
      "Онлайн-оплата выключена. Заказ можно принять с оплатой после подтверждения менеджером.",
    );
  }

  const allowedProvider = configuredProvider(method);
  if (!allowedProvider || requestedProvider !== allowedProvider) {
    throw new PaymentConfigurationError(
      method === "sbp"
        ? "Для СБП не выбран и не разрешён платёжный провайдер."
        : "Выбранный платёжный провайдер не разрешён настройками сервера.",
    );
  }

  if (requestedProvider === "mock") {
    if (mode !== "mock") {
      throw new PaymentConfigurationError(
        "MockPaymentProvider доступен только при PAYMENT_MODE=mock.",
      );
    }
    return new MockPaymentProvider(
      getPublicEnvironment().NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
      requiredSecret("PAYMENT_MOCK_WEBHOOK_SECRET"),
    );
  }

  if (requestedProvider === "yookassa") {
    return new YooKassaPaymentProvider({
      shopId: requiredSecret("YOOKASSA_SHOP_ID"),
      secretKey: requiredSecret("YOOKASSA_SECRET_KEY"),
      testMode: mode !== "live",
    });
  }

  return new TBankPaymentProvider({
    terminalKey: requiredSecret("TBANK_TERMINAL_KEY"),
    password: requiredSecret("TBANK_PASSWORD"),
    testMode: mode !== "live",
  });
}

export function getWebhookPaymentProvider(
  requestedProvider: PaymentProviderCode,
) {
  if (configuredProvider("bank_card") === requestedProvider) {
    return getPaymentProvider(requestedProvider, "bank_card");
  }
  if (configuredProvider("sbp") === requestedProvider) {
    return getPaymentProvider(requestedProvider, "sbp");
  }
  throw new PaymentConfigurationError(
    "Webhook пришёл от провайдера, который не разрешён настройками сервера.",
  );
}

export function getPaymentMode() {
  return paymentMode();
}
