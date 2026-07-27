import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

async function render(pathname) {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
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
  ["/admin", "Управление каталогом"],
  ["/admin/categories", "Категории — управление"],
  ["/admin/products", "Товары — управление"],
];

for (const [pathname, expectedText] of routes) {
  test(`renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), new RegExp(expectedText, "i"));
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
