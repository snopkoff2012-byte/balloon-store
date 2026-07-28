import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps managed delivery prices in Supabase and verifies them on the server", async () => {
  const [migration, repository, checkout, adminManager, deliveryPage] =
    await Promise.all([
      readFile(
        new URL(
          "../supabase/migrations/20260728120000_managed_delivery_zones.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../features/delivery/server-repository.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../features/checkout/checkout-form.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../features/admin/delivery/delivery-manager.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../app/(store)/delivery/page.tsx", import.meta.url),
        "utf8",
      ),
    ]);

  assert.equal(migration.match(/'region_city'/g)?.length >= 20, true);
  assert.match(migration, /'pickup'/);
  assert.match(migration, /'moscow_district'/);
  assert.match(migration, /'individual'/);
  assert.match(migration, /pricing_mode = 'manual'/);
  assert.match(migration, /minimum_order_kopecks/);
  assert.match(migration, /urgent_delivery_available/);
  assert.match(migration, /selected_zone\.delivery_intervals/);
  assert.match(migration, /grant select on public\.delivery_zones to anon/);
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /withSupabaseRequestTimeout/);
  assert.match(checkout, /findDeliveryZoneForCity/);
  assert.match(checkout, /deliveryZoneId/);
  assert.match(adminManager, /requiresManagerConfirmation/);
  assert.match(adminManager, /urgentDeliveryAvailable/);
  assert.match(deliveryPage, /loadPublicDeliveryZones/);
});
