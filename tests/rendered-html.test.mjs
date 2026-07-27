import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Маршрутные тесты не зависят от внешней сети и проверяют аварийный каталог.
// Реальный Supabase отдельно проверяется интеграционными запросами перед релизом.
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

async function render(pathname) {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "your-publishable-key",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

const routes = [
  ["/", "Воздушная Москва"],
  ["/catalog", "Шары для вашего события"],
  ["/catalog/nabory", "Готовые наборы шаров"],
  ["/product/nezhnyy-rassvet", "Нежный рассвет"],
  ["/cart", "Корзина"],
  ["/checkout", "Оформление заказа"],
  ["/delivery", "Доставка и оплата"],
  ["/contacts", "Контакты"],
  ["/admin/login", "Вход администратора"],
];

for (const [pathname, expectedText] of routes) {
  test(`renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), new RegExp(expectedText, "i"));
  });
}

for (const pathname of [
  "/admin",
  "/admin/categories",
  "/admin/products",
  "/admin/orders",
  "/admin/delivery",
  "/admin/promos",
  "/admin/settings",
]) {
  test(`protects ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 307);
    assert.equal(
      new URL(response.headers.get("location") ?? "", "http://localhost")
        .pathname,
      "/admin/login",
    );
  });
}

test("renders the custom 404 page", async () => {
  const response = await render("/takoy-stranitsy-net");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Страница не найдена/i);
});

test("does not expose the disposable starter preview", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.doesNotMatch(html, /codex-preview/i);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
  assert.match(html, /Каталог/i);
  assert.match(html, /Доставка и оплата/i);
  assert.match(html, /Соберите свою композицию/i);
  assert.match(html, /Недавние заказы/i);
  assert.match(html, /Вопросы и ответы/i);
  assert.match(html, /Telegram/i);
  assert.match(html, /WhatsApp/i);
});

test("contains the required Supabase schema and seed catalog", async () => {
  const migration = await readFile(
    new URL(
      "../supabase/migrations/20260727133000_initial_store_schema.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const seed = await readFile(
    new URL("../supabase/seed.sql", import.meta.url),
    "utf8",
  );

  for (const table of [
    "categories",
    "products",
    "product_images",
    "product_categories",
    "product_options",
    "product_option_values",
    "orders",
    "order_items",
    "customers",
    "delivery_zones",
    "promo_codes",
    "site_settings",
    "constructor_items",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\b`));
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
  }

  assert.match(migration, /catalog-images/);
  assert.equal(
    seed.match(/insert into public\.products \(/g)?.length,
    20,
  );
  assert.equal(
    seed.match(/insert into public\.categories \(/g)?.length,
    8,
  );
});

test("contains secure admin panel migration and owner guide", async () => {
  const migration = await readFile(
    new URL(
      "../supabase/migrations/20260727183000_secure_admin_panel.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const guide = await readFile(
    new URL("../docs/ADMIN_GUIDE.md", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create table if not exists public\.order_status_history/);
  assert.match(migration, /create table if not exists public\.admin_audit_log/);
  assert.match(migration, /create or replace function public\.is_store_owner/);
  assert.match(migration, /drop policy if exists "active_admin_manage_admin_profiles"/);
  assert.match(guide, /Как войти/);
  assert.match(guide, /Как добавить категорию/);
  assert.match(guide, /Как добавить товар/);
  assert.match(guide, /Как изменить цену/);
  assert.match(guide, /Как скрыть товар/);
  assert.match(guide, /Как посмотреть заказ/);
});
