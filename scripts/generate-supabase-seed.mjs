import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const rawCatalog = JSON.parse(
  await readFile(new URL("../data/mock-catalog.json", import.meta.url), "utf8"),
);

function uuid(value) {
  const hex = createHash("sha256").update(`balloon-store:${value}`).digest("hex");
  const normalized = `${hex.slice(0, 12)}4${hex.slice(13, 16)}8${hex.slice(17, 32)}`;
  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join("-");
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlBoolean(value) {
  return value ? "true" : "false";
}

const sizeModifiers = {
  Компактный: -50000,
  Стандартный: 0,
  Большой: 150000,
  XL: 280000,
};

function productAttributes(product) {
  return [
    {
      id: `${product.id}-attribute-material`,
      code: "material",
      name: "Материал",
      type: "text",
      value: product.material,
      unit: null,
      filterable: true,
      sortOrder: 0,
    },
    {
      id: `${product.id}-attribute-colors`,
      code: "colors",
      name: "Доступные цвета",
      type: "multiselect",
      value: product.colors,
      unit: null,
      filterable: true,
      sortOrder: 1,
    },
    {
      id: `${product.id}-attribute-sizes`,
      code: "sizes",
      name: "Размеры",
      type: "multiselect",
      value: product.sizes,
      unit: null,
      filterable: true,
      sortOrder: 2,
    },
    {
      id: `${product.id}-attribute-manufacturing`,
      code: "manufacturing_time",
      name: "Примерное время изготовления",
      type: "text",
      value: product.manufacturingTime,
      unit: null,
      filterable: false,
      sortOrder: 3,
    },
  ];
}

function productOptions(product) {
  const options = [];
  if (product.colors.length > 0) {
    options.push({
      code: "color",
      name: "Цвет",
      values: product.colors.map((color) => ({
        label: color,
        value: color.toLocaleLowerCase("ru").replaceAll(" ", "-"),
        priceModifierKopecks: color.includes("Хром") ? 30000 : 0,
      })),
    });
  }
  if (product.sizes.length > 0) {
    options.push({
      code: "size",
      name: "Размер композиции",
      values: product.sizes.map((size) => ({
        label: size,
        value: size.toLocaleLowerCase("ru").replaceAll(" ", "-"),
        priceModifierKopecks: sizeModifiers[size] ?? 0,
      })),
    });
  }
  return [...options, ...product.extraOptions];
}

const lines = [
  "-- Этот файл сгенерирован из data/mock-catalog.json.",
  "-- Для обновления: node scripts/generate-supabase-seed.mjs",
  "",
  "begin;",
  "",
];

for (const category of rawCatalog.categories) {
  const categoryId = uuid(category.id);
  const parentId = category.parentId ? uuid(category.parentId) : null;
  lines.push(
    `insert into public.categories (` +
      `id, name, slug, short_description, full_description, image_path, parent_id, ` +
      `sort_order, publication_status, seo_title, seo_description, created_at, updated_at` +
      `) values (` +
      [
        sqlString(categoryId),
        sqlString(category.name),
        sqlString(category.slug),
        sqlString(category.shortDescription),
        sqlString(category.fullDescription),
        sqlString(`categories/${categoryId}/cover.png`),
        sqlString(parentId),
        category.sortOrder,
        sqlString(category.publicationStatus),
        sqlString(category.seoTitle),
        sqlString(category.seoDescription),
        sqlString(category.createdAt),
        sqlString(category.updatedAt),
      ].join(", ") +
      `) on conflict (id) do update set ` +
      `name = excluded.name, slug = excluded.slug, short_description = excluded.short_description, ` +
      `full_description = excluded.full_description, image_path = excluded.image_path, ` +
      `parent_id = excluded.parent_id, sort_order = excluded.sort_order, ` +
      `publication_status = excluded.publication_status, seo_title = excluded.seo_title, ` +
      `seo_description = excluded.seo_description, updated_at = excluded.updated_at;`,
  );
}

lines.push("");

for (const product of rawCatalog.products) {
  const productId = uuid(product.id);
  const primaryCategoryId = uuid(product.primaryCategoryId);
  const attributes = productAttributes(product);
  const productType =
    product.id === "product-cloud" ? "composition" : "simple";

  lines.push(
    `insert into public.products (` +
      `id, name, slug, sku, product_type, short_description, full_description, ` +
      `regular_price_kopecks, sale_price_kopecks, cost_price_kopecks, primary_category_id, ` +
      `stock_quantity, availability_status, is_made_to_order, is_bestseller, is_new, ` +
      `is_recommended, sort_order, attributes, seo_title, seo_description, ` +
      `publication_status, created_at, updated_at` +
      `) values (` +
      [
        sqlString(productId),
        sqlString(product.name),
        sqlString(product.slug),
        sqlString(product.sku),
        sqlString(productType),
        sqlString(product.shortDescription),
        sqlString(product.fullDescription),
        product.regularPriceKopecks,
        product.salePriceKopecks ?? "null",
        product.costPriceKopecks ?? "null",
        sqlString(primaryCategoryId),
        product.stockQuantity ?? "null",
        sqlString(product.availabilityStatus),
        sqlBoolean(product.isMadeToOrder),
        sqlBoolean(product.isBestseller),
        sqlBoolean(product.isNew),
        sqlBoolean(product.isRecommended),
        product.sortOrder,
        sqlJson(attributes),
        sqlString(`${product.name} — заказать с доставкой`),
        sqlString(product.shortDescription),
        sqlString(product.publicationStatus),
        sqlString(product.createdAt),
        sqlString(product.createdAt),
      ].join(", ") +
      `) on conflict (id) do update set ` +
      `name = excluded.name, slug = excluded.slug, sku = excluded.sku, ` +
      `product_type = excluded.product_type, short_description = excluded.short_description, ` +
      `full_description = excluded.full_description, regular_price_kopecks = excluded.regular_price_kopecks, ` +
      `sale_price_kopecks = excluded.sale_price_kopecks, cost_price_kopecks = excluded.cost_price_kopecks, ` +
      `primary_category_id = excluded.primary_category_id, stock_quantity = excluded.stock_quantity, ` +
      `availability_status = excluded.availability_status, is_made_to_order = excluded.is_made_to_order, ` +
      `is_bestseller = excluded.is_bestseller, is_new = excluded.is_new, ` +
      `is_recommended = excluded.is_recommended, sort_order = excluded.sort_order, ` +
      `attributes = excluded.attributes, seo_title = excluded.seo_title, ` +
      `seo_description = excluded.seo_description, publication_status = excluded.publication_status, ` +
      `updated_at = excluded.updated_at;`,
  );

  product.categoryIds.forEach((categoryKey, index) => {
    lines.push(
      `insert into public.product_categories (` +
        `product_id, category_id, is_primary, sort_order` +
        `) values (` +
        [
          sqlString(productId),
          sqlString(uuid(categoryKey)),
          sqlBoolean(categoryKey === product.primaryCategoryId),
          index,
        ].join(", ") +
        `) on conflict (product_id, category_id) do update set ` +
        `is_primary = excluded.is_primary, sort_order = excluded.sort_order;`,
    );
  });

  [
    {
      key: "main",
      path: `products/${productId}/main.png`,
      alt: product.name,
      primary: true,
      order: 0,
    },
    {
      key: "detail",
      path: `products/${productId}/detail.png`,
      alt: `${product.name}, дополнительный ракурс`,
      primary: false,
      order: 1,
    },
  ].forEach((image) => {
    lines.push(
      `insert into public.product_images (` +
        `id, product_id, storage_path, alt_text, sort_order, is_primary` +
        `) values (` +
        [
          sqlString(uuid(`${product.id}-image-${image.key}`)),
          sqlString(productId),
          sqlString(image.path),
          sqlString(image.alt),
          image.order,
          sqlBoolean(image.primary),
        ].join(", ") +
        `) on conflict (id) do update set ` +
        `storage_path = excluded.storage_path, alt_text = excluded.alt_text, ` +
        `sort_order = excluded.sort_order, is_primary = excluded.is_primary;`,
    );
  });

  const options = productOptions(product);
  const defaultValueIds = [];
  options.forEach((option, optionIndex) => {
    const optionId = uuid(`${product.id}-option-${option.code}`);
    lines.push(
      `insert into public.product_options (` +
        `id, product_id, code, name, option_type, is_required, sort_order` +
        `) values (` +
        [
          sqlString(optionId),
          sqlString(productId),
          sqlString(option.code),
          sqlString(option.name),
          sqlString("select"),
          "true",
          optionIndex,
        ].join(", ") +
        `) on conflict (id) do update set ` +
        `code = excluded.code, name = excluded.name, option_type = excluded.option_type, ` +
        `is_required = excluded.is_required, sort_order = excluded.sort_order;`,
    );

    option.values.forEach((value, valueIndex) => {
      const valueId = uuid(`${product.id}-${option.code}-${value.value}`);
      if (valueIndex === 0) defaultValueIds.push(valueId);
      lines.push(
        `insert into public.product_option_values (` +
          `id, option_id, label, value, price_modifier_kopecks, sort_order` +
          `) values (` +
          [
            sqlString(valueId),
            sqlString(optionId),
            sqlString(value.label),
            sqlString(value.value),
            value.priceModifierKopecks,
            valueIndex,
          ].join(", ") +
          `) on conflict (id) do update set ` +
          `label = excluded.label, value = excluded.value, ` +
          `price_modifier_kopecks = excluded.price_modifier_kopecks, ` +
          `sort_order = excluded.sort_order;`,
      );
    });
  });

  lines.push(
    `insert into public.product_variants (` +
      `id, product_id, sku, option_value_ids, price_modifier_kopecks, ` +
      `stock_quantity, availability_status, is_active` +
      `) values (` +
      [
        sqlString(uuid(`${product.id}-variant-default`)),
        sqlString(productId),
        sqlString(product.sku),
        `array[${defaultValueIds.map(sqlString).join(", ")}]::uuid[]`,
        0,
        product.stockQuantity ?? "null",
        sqlString(product.availabilityStatus),
        "true",
      ].join(", ") +
      `) on conflict (id) do update set ` +
      `sku = excluded.sku, option_value_ids = excluded.option_value_ids, ` +
      `stock_quantity = excluded.stock_quantity, ` +
      `availability_status = excluded.availability_status, is_active = excluded.is_active;`,
  );
  lines.push("");
}

const deliveryZones = [
  [
    "moscow-center",
    "Москва в пределах МКАД",
    "Доставка по Москве в пределах МКАД.",
    79000,
    0,
    1500000,
    300000,
    70000,
    ["10:00–13:00", "13:00–16:00", "16:00–19:00", "19:00–22:00"],
    10,
  ],
  [
    "moscow-near",
    "До 20 км от МКАД",
    "Ближнее Подмосковье до 20 км от МКАД.",
    99000,
    5000,
    2000000,
    500000,
    90000,
    ["10:00–14:00", "14:00–18:00", "18:00–22:00"],
    20,
  ],
  [
    "moscow-region",
    "Московская область",
    "Дальние районы Московской области, стоимость уточняет менеджер.",
    149000,
    7000,
    null,
    700000,
    120000,
    ["10:00–15:00", "15:00–20:00"],
    30,
  ],
];

for (const [
  slug,
  name,
  description,
  base,
  perKm,
  freeFrom,
  minimumOrder,
  urgentSurcharge,
  intervals,
  order,
] of deliveryZones) {
  lines.push(
    `insert into public.delivery_zones (` +
      `id, name, slug, description, base_price_kopecks, price_per_km_kopecks, ` +
      `free_from_kopecks, minimum_order_kopecks, urgent_surcharge_kopecks, ` +
      `delivery_intervals, is_active, sort_order` +
      `) values (` +
      [
        sqlString(uuid(`delivery-${slug}`)),
        sqlString(name),
        sqlString(slug),
        sqlString(description),
        base,
        perKm,
        freeFrom ?? "null",
        minimumOrder,
        urgentSurcharge,
        sqlJson(intervals),
        "true",
        order,
      ].join(", ") +
      `) on conflict (id) do update set ` +
      `name = excluded.name, description = excluded.description, ` +
      `base_price_kopecks = excluded.base_price_kopecks, ` +
      `price_per_km_kopecks = excluded.price_per_km_kopecks, ` +
      `free_from_kopecks = excluded.free_from_kopecks, ` +
      `minimum_order_kopecks = excluded.minimum_order_kopecks, ` +
      `urgent_surcharge_kopecks = excluded.urgent_surcharge_kopecks, ` +
      `delivery_intervals = excluded.delivery_intervals, ` +
      `is_active = excluded.is_active;`,
  );
}

lines.push(
  "",
  `insert into public.promo_codes (` +
    `id, code, description, discount_type, discount_value, minimum_order_kopecks, ` +
    `maximum_discount_kopecks, per_customer_limit, usage_limit, is_active` +
    `) values (` +
    [
      sqlString(uuid("promo-welcome10")),
      sqlString("WELCOME10"),
      sqlString("Скидка 10% на первый заказ"),
      sqlString("percent"),
      10,
      500000,
      150000,
      1,
      100,
      "true",
    ].join(", ") +
    `) on conflict (id) do update set description = excluded.description, ` +
    `minimum_order_kopecks = excluded.minimum_order_kopecks, ` +
    `maximum_discount_kopecks = excluded.maximum_discount_kopecks, ` +
    `per_customer_limit = excluded.per_customer_limit, ` +
    `usage_limit = excluded.usage_limit, is_active = excluded.is_active;`,
  "",
  `insert into public.site_settings (key, value, description) values`,
  `  ('store.contacts', ${sqlJson({
    phone: "+7 (495) 000-00-00",
    email: "hello@example.ru",
    telegram: "balloon_moscow_demo",
    whatsapp: "+7 900 000-00-00",
    address: "Москва, Большая Никитская улица, 24",
  })}, 'Контакты магазина'),`,
  `  ('store.working_hours', ${sqlJson({
    timezone: "Europe/Moscow",
    daily: "09:00–21:00",
  })}, 'Режим работы'),`,
  `  ('store.checkout', ${sqlJson({
    minimumOrderRub: 3000,
  })}, 'Ограничения оформления заказа'),`,
  `  ('home.hero', ${sqlJson({
    eyebrow: "Доставим праздник сегодня",
    title: "Воздушные шары с настроением",
    description:
      "Соберём композицию под ваш повод и аккуратно привезём по Москве и области.",
  })}, 'Тексты первого экрана')`,
  `on conflict (key) do update set value = excluded.value, description = excluded.description;`,
  "",
);

const compositionProductId = uuid("product-cloud");
const compositionComponents = [
  ["product-confetti", 5, 10],
  ["product-star", 1, 20],
];
for (const [componentKey, quantity, order] of compositionComponents) {
  lines.push(
    `insert into public.constructor_items (` +
      `id, product_id, component_product_id, minimum_quantity, maximum_quantity, ` +
      `is_required, group_code, sort_order` +
      `) values (` +
      [
        sqlString(uuid(`constructor-${componentKey}`)),
        sqlString(compositionProductId),
        sqlString(uuid(componentKey)),
        quantity,
        quantity * 3,
        "true",
        sqlString("base"),
        order,
      ].join(", ") +
      `) on conflict (id) do update set ` +
      `minimum_quantity = excluded.minimum_quantity, ` +
      `maximum_quantity = excluded.maximum_quantity, sort_order = excluded.sort_order;`,
  );
}

const customerId = uuid("customer-demo");
const orderId = uuid("order-demo");
const orderProduct = rawCatalog.products[0];
const orderProductId = uuid(orderProduct.id);
const orderVariantId = uuid(`${orderProduct.id}-variant-default`);

lines.push(
  "",
  `insert into public.customers (id, name, phone, email, metadata) values (` +
    [
      sqlString(customerId),
      sqlString("Тестовый покупатель"),
      sqlString("+7 900 000-00-00"),
      sqlString("buyer@example.ru"),
      sqlJson({ source: "seed" }),
    ].join(", ") +
    `) on conflict (id) do update set name = excluded.name, phone = excluded.phone;`,
  "",
  `insert into public.orders (` +
    `id, public_token, customer_id, status, customer_name, customer_phone, ` +
    `customer_email, comment, manager_comment, delivery_address, delivery_zone_id, ` +
    `requested_delivery_date, requested_delivery_slot, items_total_kopecks, ` +
    `discount_kopecks, delivery_kopecks, total_kopecks, currency, payment_status, ` +
    `payment_method, delivery_status, urgent_delivery, idempotency_key` +
    `) values (` +
    [
      sqlString(orderId),
      sqlString(uuid("order-demo-public-token")),
      sqlString(customerId),
      sqlString("new"),
      sqlString("Тестовый покупатель"),
      sqlString("+7 900 000-00-00"),
      sqlString("buyer@example.ru"),
      sqlString("Позвонить за час до доставки"),
      sqlString("Уточнить цвет лент"),
      sqlJson({
        city: "Москва",
        street: "Тестовая улица",
        house: "1",
        apartment: "12",
      }),
      sqlString(uuid("delivery-moscow-center")),
      sqlString("2026-08-15"),
      sqlString("13:00–16:00"),
      orderProduct.salePriceKopecks,
      0,
      79000,
      orderProduct.salePriceKopecks + 79000,
      sqlString("RUB"),
      sqlString("awaiting"),
      sqlString("on_confirmation"),
      sqlString("not_scheduled"),
      "false",
      sqlString("seed-order-demo"),
    ].join(", ") +
    `) on conflict (id) do update set status = excluded.status, ` +
    `manager_comment = excluded.manager_comment, ` +
    `payment_status = excluded.payment_status, ` +
    `delivery_status = excluded.delivery_status, ` +
    `updated_at = timezone('utc', now());`,
  "",
  `insert into public.order_items (` +
    `id, order_id, product_id, variant_id, quantity, unit_price_kopecks, ` +
    `line_total_kopecks, product_snapshot, selected_options` +
    `) values (` +
    [
      sqlString(uuid("order-item-demo")),
      sqlString(orderId),
      sqlString(orderProductId),
      sqlString(orderVariantId),
      1,
      orderProduct.salePriceKopecks,
      orderProduct.salePriceKopecks,
      sqlJson({
        name: orderProduct.name,
        sku: orderProduct.sku,
        image: "/og.png",
      }),
      sqlJson({ color: "Пудровый", size: "Стандартный" }),
    ].join(", ") +
    `) on conflict (id) do update set product_snapshot = excluded.product_snapshot;`,
  "",
  "commit;",
);

await writeFile(
  new URL("../supabase/seed.sql", import.meta.url),
  `${lines.join("\n")}\n`,
  "utf8",
);

console.log(
  `Generated supabase/seed.sql: ${rawCatalog.categories.length} categories, ${rawCatalog.products.length} products.`,
);
