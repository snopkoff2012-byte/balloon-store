import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps payment creation server-side and amount authoritative", async () => {
  const [contracts, service, route, environment] = await Promise.all([
    readFile(
      new URL("../features/payments/contracts.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../features/payments/server-service.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/api/admin/payments/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(contracts, /interface PaymentProvider/);
  assert.match(contracts, /bank_card/);
  assert.match(contracts, /sbp/);
  assert.match(service, /order\.total_kopecks/);
  assert.match(service, /createMoney\(amountKopecks\)/);
  assert.doesNotMatch(route, /amount|total_kopecks/);
  assert.match(environment, /PAYMENT_MODE=disabled/);
  assert.match(environment, /PAYMENT_MOCK_WEBHOOK_SECRET/);
  assert.doesNotMatch(
    environment,
    /NEXT_PUBLIC_(?:YOOKASSA|TBANK|PAYMENT_MOCK|SUPABASE_SERVICE_ROLE)/,
  );
});

test("stores payment status separately and applies webhooks idempotently", async () => {
  const [migration, webhookRoute, statusPage] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260729120000_payment_architecture.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/api/payments/webhooks/[provider]/route.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../features/payments/payment-status-panel.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(migration, /create table if not exists public\.payments/);
  assert.match(
    migration,
    /create table if not exists public\.payment_events/,
  );
  assert.match(migration, /unique \(provider, provider_event_id\)/);
  assert.match(migration, /apply_verified_payment_webhook/);
  assert.match(migration, /on conflict \(provider, provider_event_id\) do nothing/);
  assert.match(migration, /status in \('creating', 'pending'\)/);
  assert.doesNotMatch(migration, /card_number|card_cvv|card_cvc|expiry_date/i);
  assert.match(webhookRoute, /processPaymentWebhook/);
  assert.match(statusPage, /Возврат на эту страницу не подтверждает оплату/);
});

test("ships mock implementation and inactive future adapters", async () => {
  const [mock, yookassa, tbank] = await Promise.all([
    readFile(
      new URL("../features/payments/providers/mock.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../features/payments/providers/yookassa.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../features/payments/providers/tbank.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(mock, /class MockPaymentProvider implements PaymentProvider/);
  assert.match(mock, /hmacSha256Hex/);
  assert.match(mock, /constantTimeEqual/);
  assert.match(yookassa, /class YooKassaPaymentProvider/);
  assert.match(tbank, /class TBankPaymentProvider/);
  assert.match(yookassa, /PaymentProviderNotActivatedError/);
  assert.match(tbank, /PaymentProviderNotActivatedError/);
});
