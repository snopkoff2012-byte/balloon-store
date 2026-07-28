import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps cart pricing and order verification on protected paths", async () => {
  const [pricing, cartView, orderRoute, migration] = await Promise.all([
    readFile(new URL("../features/cart/pricing.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/cart/cart-view.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../supabase/migrations/20260728120000_managed_delivery_zones.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(pricing, /STANDARD_DELIVERY|FREE_DELIVERY_FROM/);
  assert.match(cartView, /Рассчитаем на оформлении/);
  assert.match(cartView, /Отправить корзину в Telegram/);
  assert.match(cartView, /Отправить корзину в WhatsApp/);
  assert.match(orderRoute, /create_public_order/);
  assert.doesNotMatch(orderRoute, /unitPriceKopecks/);
  assert.match(migration, /security definer/);
  assert.match(migration, /publication_status = 'published'/);
  assert.match(migration, /CART_UNAVAILABLE/);
  assert.match(migration, /selected_zone\.base_price_kopecks/);
  assert.match(migration, /grant execute on function public\.create_public_order\(jsonb\) to anon, authenticated/);
});
