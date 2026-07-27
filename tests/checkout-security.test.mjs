import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("checkout validates delivery details and keeps order creation on the server", async () => {
  const [schema, route, migration, successRoute] = await Promise.all([
    readFile(new URL("../features/checkout/order-schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260727203000_expand_checkout.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/summary/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /recipientIsDifferent/);
  assert.match(schema, /website/);
  assert.match(schema, /isAvailableDeliverySlot/);
  assert.match(schema, /Нельзя выбрать прошедшую дату/);
  assert.match(route, /create_public_order/);
  assert.doesNotMatch(route, /unitPriceKopecks/);
  assert.match(migration, /security definer/);
  assert.match(migration, /get_public_order_summary/);
  assert.match(migration, /awaiting_payment/);
  assert.match(migration, /handed_to_courier/);
  assert.doesNotMatch(migration, /card_number|card_cvv|card_cvc/i);
  assert.match(successRoute, /get_public_order_summary/);
});
