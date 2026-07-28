export class PaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

export class PaymentAuthenticationError extends Error {
  constructor(message = "Подпись уведомления об оплате не прошла проверку.") {
    super(message);
    this.name = "PaymentAuthenticationError";
  }
}

export class PaymentProviderNotActivatedError extends Error {
  constructor(providerName: string) {
    super(
      `Адаптер ${providerName} подготовлен, но реальная оплата не активирована. Нужны ключи и отдельное тестирование.`,
    );
    this.name = "PaymentProviderNotActivatedError";
  }
}

export class PaymentRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentRequestError";
  }
}
