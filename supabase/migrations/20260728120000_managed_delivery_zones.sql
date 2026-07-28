begin;

-- Тарифы и правила доставки хранятся только в базе и редактируются из
-- административной панели. Код витрины не содержит цен доставки.
alter table public.delivery_zones
  add column if not exists zone_type text not null default 'individual',
  add column if not exists match_terms jsonb not null default '[]'::jsonb,
  add column if not exists pricing_mode text not null default 'fixed',
  add column if not exists urgent_delivery_available boolean not null default false,
  add column if not exists requires_manager_confirmation boolean not null default false;

alter table public.delivery_zones
  drop constraint if exists delivery_zones_zone_type_check,
  add constraint delivery_zones_zone_type_check check (
    zone_type in ('pickup', 'moscow_district', 'region_city', 'individual')
  ),
  drop constraint if exists delivery_zones_match_terms_array_check,
  add constraint delivery_zones_match_terms_array_check check (
    jsonb_typeof(match_terms) = 'array'
  ),
  drop constraint if exists delivery_zones_pricing_mode_check,
  add constraint delivery_zones_pricing_mode_check check (
    pricing_mode in ('fixed', 'manual')
  );

alter table public.orders
  add column if not exists delivery_zone_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists delivery_price_pending boolean not null default false,
  add column if not exists delivery_requires_confirmation boolean not null default false;

alter table public.orders
  drop constraint if exists orders_delivery_zone_snapshot_object_check,
  add constraint orders_delivery_zone_snapshot_object_check check (
    jsonb_typeof(delivery_zone_snapshot) = 'object'
  );

create index if not exists delivery_zones_public_type_sort_idx
  on public.delivery_zones (zone_type, sort_order)
  where is_active;
create index if not exists delivery_zones_match_terms_gin_idx
  on public.delivery_zones using gin (match_terms);
create index if not exists orders_delivery_confirmation_created_idx
  on public.orders (delivery_requires_confirmation, created_at desc)
  where delivery_requires_confirmation;

grant select on public.delivery_zones to anon;
drop policy if exists "public_read_active_delivery_zones"
  on public.delivery_zones;
create policy "public_read_active_delivery_zones"
on public.delivery_zones for select
to anon
using (is_active);

-- Старые демонстрационные зоны скрываются, но сохраняются для истории.
update public.delivery_zones
set
  is_active = false,
  zone_type = 'individual',
  requires_manager_confirmation = true
where slug in ('moscow-center', 'moscow-near', 'moscow-region');

insert into public.delivery_zones (
  id,
  name,
  slug,
  description,
  zone_type,
  match_terms,
  pricing_mode,
  base_price_kopecks,
  price_per_km_kopecks,
  free_from_kopecks,
  minimum_order_kopecks,
  urgent_delivery_available,
  urgent_surcharge_kopecks,
  delivery_intervals,
  requires_manager_confirmation,
  is_active,
  sort_order
)
select
  extensions.gen_random_uuid(),
  seed.name,
  seed.slug,
  seed.description,
  seed.zone_type,
  seed.match_terms::jsonb,
  seed.pricing_mode,
  seed.base_price_kopecks,
  0,
  seed.free_from_kopecks,
  seed.minimum_order_kopecks,
  seed.urgent_delivery_available,
  seed.urgent_surcharge_kopecks,
  seed.delivery_intervals::jsonb,
  seed.requires_manager_confirmation,
  true,
  seed.sort_order
from (
  values
    ('Самовывоз', 'pickup', 'Бесплатный самовывоз. Адрес и готовность заказа подтверждает менеджер.', 'pickup', '["самовывоз"]', 'fixed', 0::bigint, 0::bigint, 300000::bigint, false, 0::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 10),
    ('ЦАО', 'moscow-cao', 'Доставка по Центральному административному округу Москвы.', 'moscow_district', '["цао","центральный административный округ"]', 'fixed', 79000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 100),
    ('САО', 'moscow-sao', 'Доставка по Северному административному округу Москвы.', 'moscow_district', '["сао","северный административный округ"]', 'fixed', 89000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 110),
    ('СВАО', 'moscow-svao', 'Доставка по Северо-Восточному административному округу Москвы.', 'moscow_district', '["свао","северо-восточный административный округ"]', 'fixed', 89000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 120),
    ('ВАО', 'moscow-vao', 'Доставка по Восточному административному округу Москвы.', 'moscow_district', '["вао","восточный административный округ"]', 'fixed', 99000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 130),
    ('ЮВАО', 'moscow-uvao', 'Доставка по Юго-Восточному административному округу Москвы.', 'moscow_district', '["ювао","юго-восточный административный округ"]', 'fixed', 99000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 140),
    ('ЮАО', 'moscow-uao', 'Доставка по Южному административному округу Москвы.', 'moscow_district', '["юао","южный административный округ"]', 'fixed', 89000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 150),
    ('ЮЗАО', 'moscow-uzao', 'Доставка по Юго-Западному административному округу Москвы.', 'moscow_district', '["юзао","юго-западный административный округ"]', 'fixed', 99000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 160),
    ('ЗАО', 'moscow-zao', 'Доставка по Западному административному округу Москвы.', 'moscow_district', '["зао","западный административный округ"]', 'fixed', 99000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 170),
    ('СЗАО', 'moscow-szao', 'Доставка по Северо-Западному административному округу Москвы.', 'moscow_district', '["сзао","северо-западный административный округ"]', 'fixed', 99000::bigint, 1500000::bigint, 300000::bigint, true, 70000::bigint, '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]', false, 180),
    ('Балашиха', 'city-balashikha', 'Доставка в Балашиху. Адрес подтверждается менеджером.', 'region_city', '["балашиха"]', 'fixed', 119000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 300),
    ('Подольск', 'city-podolsk', 'Доставка в Подольск. Адрес подтверждается менеджером.', 'region_city', '["подольск"]', 'fixed', 139000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 310),
    ('Химки', 'city-khimki', 'Доставка в Химки. Адрес подтверждается менеджером.', 'region_city', '["химки"]', 'fixed', 99000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 320),
    ('Мытищи', 'city-mytishchi', 'Доставка в Мытищи. Адрес подтверждается менеджером.', 'region_city', '["мытищи"]', 'fixed', 109000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 330),
    ('Королёв', 'city-korolev', 'Доставка в Королёв. Адрес подтверждается менеджером.', 'region_city', '["королёв","королев"]', 'fixed', 119000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 340),
    ('Люберцы', 'city-lyubertsy', 'Доставка в Люберцы. Адрес подтверждается менеджером.', 'region_city', '["люберцы"]', 'fixed', 109000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 350),
    ('Красногорск', 'city-krasnogorsk', 'Доставка в Красногорск. Адрес подтверждается менеджером.', 'region_city', '["красногорск"]', 'fixed', 109000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 360),
    ('Электросталь', 'city-elektrostal', 'Доставка в Электросталь. Адрес подтверждается менеджером.', 'region_city', '["электросталь"]', 'fixed', 179000::bigint, 2500000::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 370),
    ('Коломна', 'city-kolomna', 'Доставка в Коломну. Адрес подтверждается менеджером.', 'region_city', '["коломна"]', 'fixed', 219000::bigint, 3000000::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 380),
    ('Одинцово', 'city-odintsovo', 'Доставка в Одинцово. Адрес подтверждается менеджером.', 'region_city', '["одинцово"]', 'fixed', 109000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 390),
    ('Домодедово', 'city-domodedovo', 'Доставка в Домодедово. Адрес подтверждается менеджером.', 'region_city', '["домодедово"]', 'fixed', 149000::bigint, 2500000::bigint, 500000::bigint, true, 110000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 400),
    ('Щёлково', 'city-shchyolkovo', 'Доставка в Щёлково. Адрес подтверждается менеджером.', 'region_city', '["щёлково","щелково"]', 'fixed', 139000::bigint, 2500000::bigint, 500000::bigint, true, 110000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 410),
    ('Серпухов', 'city-serpukhov', 'Доставка в Серпухов. Адрес подтверждается менеджером.', 'region_city', '["серпухов"]', 'fixed', 229000::bigint, 3000000::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 420),
    ('Раменское', 'city-ramenskoye', 'Доставка в Раменское. Адрес подтверждается менеджером.', 'region_city', '["раменское"]', 'fixed', 159000::bigint, 2500000::bigint, 500000::bigint, true, 110000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 430),
    ('Долгопрудный', 'city-dolgoprudny', 'Доставка в Долгопрудный. Адрес подтверждается менеджером.', 'region_city', '["долгопрудный"]', 'fixed', 109000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 440),
    ('Реутов', 'city-reutov', 'Доставка в Реутов. Адрес подтверждается менеджером.', 'region_city', '["реутов"]', 'fixed', 99000::bigint, 2000000::bigint, 500000::bigint, true, 90000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 450),
    ('Пушкино', 'city-pushkino', 'Доставка в Пушкино. Адрес подтверждается менеджером.', 'region_city', '["пушкино"]', 'fixed', 139000::bigint, 2500000::bigint, 500000::bigint, true, 110000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 460),
    ('Жуковский', 'city-zhukovsky', 'Доставка в Жуковский. Адрес подтверждается менеджером.', 'region_city', '["жуковский"]', 'fixed', 159000::bigint, 2500000::bigint, 500000::bigint, true, 110000::bigint, '["10:00–14:00","14:00–18:00","18:00–22:00"]', true, 470),
    ('Ногинск', 'city-noginsk', 'Доставка в Ногинск. Адрес подтверждается менеджером.', 'region_city', '["ногинск","богородский"]', 'fixed', 169000::bigint, 2500000::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 480),
    ('Сергиев Посад', 'city-sergiev-posad', 'Доставка в Сергиев Посад. Адрес подтверждается менеджером.', 'region_city', '["сергиев посад"]', 'fixed', 199000::bigint, 3000000::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 490),
    ('Индивидуальный расчёт', 'individual-delivery', 'Для других городов и сложных адресов стоимость и возможность доставки подтвердит менеджер.', 'individual', '[]', 'manual', 0::bigint, null::bigint, 700000::bigint, false, 0::bigint, '["10:00–15:00","15:00–20:00"]', true, 900)
) as seed(
  name,
  slug,
  description,
  zone_type,
  match_terms,
  pricing_mode,
  base_price_kopecks,
  free_from_kopecks,
  minimum_order_kopecks,
  urgent_delivery_available,
  urgent_surcharge_kopecks,
  delivery_intervals,
  requires_manager_confirmation,
  sort_order
)
on conflict do nothing;

drop function if exists public.create_public_order(jsonb);

create function public.create_public_order(order_input jsonb)
returns table (
  order_id uuid,
  order_number bigint,
  public_token uuid,
  items_total_kopecks bigint,
  discount_kopecks bigint,
  delivery_kopecks bigint,
  total_kopecks bigint,
  delivery_price_pending boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  input_item record;
  current_product public.products%rowtype;
  current_variant public.product_variants%rowtype;
  selected_zone public.delivery_zones%rowtype;
  created_order public.orders%rowtype;
  existing_order public.orders%rowtype;
  customer_id uuid;
  selected_value_ids uuid[];
  selected_options_snapshot jsonb;
  option_surcharge bigint;
  unit_price bigint;
  regular_unit_price bigint;
  line_total bigint;
  calculated_items_total bigint := 0;
  calculated_discount bigint := 0;
  calculated_delivery bigint;
  calculated_total bigint;
  order_items_payload jsonb := '[]'::jsonb;
  order_item jsonb;
  has_sellable_variants boolean;
  request_key text;
  fulfillment text;
  requested_date date;
  requested_slot text;
  delivery_city text;
  delivery_address text;
  delivery_zone_id uuid;
  requested_urgent boolean;
  slot_start_hour integer;
  price_pending boolean := false;
begin
  if jsonb_typeof(order_input) <> 'object'
    or jsonb_typeof(order_input -> 'items') <> 'array'
    or jsonb_array_length(order_input -> 'items') = 0
    or coalesce(order_input ->> 'website', '') <> '' then
    raise exception 'CART_INVALID';
  end if;
  if coalesce((order_input ->> 'submitted_at')::bigint, 0) < extract(epoch from now() - interval '1 hour') * 1000
    or coalesce((order_input ->> 'submitted_at')::bigint, 0) > extract(epoch from now() + interval '5 minutes') * 1000 then
    raise exception 'CART_INVALID';
  end if;

  request_key := nullif(trim(order_input ->> 'idempotency_key'), '');
  if request_key is null or length(request_key) < 16 then
    raise exception 'CART_INVALID';
  end if;
  select * into existing_order
  from public.orders
  where idempotency_key = request_key;
  if found then
    return query
      select
        existing_order.id,
        existing_order.order_number,
        existing_order.public_token,
        existing_order.items_total_kopecks,
        existing_order.discount_kopecks,
        coalesce(existing_order.delivery_kopecks, 0),
        coalesce(existing_order.total_kopecks, existing_order.items_total_kopecks),
        existing_order.delivery_price_pending;
    return;
  end if;

  fulfillment := coalesce(order_input ->> 'fulfillment_method', '');
  requested_date := nullif(order_input ->> 'requested_delivery_date', '')::date;
  requested_slot := nullif(trim(order_input ->> 'requested_delivery_slot'), '');
  delivery_city := trim(coalesce(order_input ->> 'city', ''));
  delivery_address := trim(coalesce(order_input ->> 'address', ''));
  delivery_zone_id := nullif(order_input ->> 'delivery_zone_id', '')::uuid;
  requested_urgent := coalesce((order_input ->> 'urgent_delivery')::boolean, false);

  select *
  into selected_zone
  from public.delivery_zones
  where id = delivery_zone_id
    and is_active
  for share;

  if not found
    or (fulfillment = 'pickup' and selected_zone.zone_type <> 'pickup')
    or (fulfillment = 'delivery' and selected_zone.zone_type = 'pickup') then
    raise exception 'CART_DELIVERY';
  end if;

  if coalesce(length(trim(order_input ->> 'customer_name')), 0) < 2
    or regexp_replace(coalesce(order_input ->> 'customer_phone', ''), '\D', '', 'g') !~ '^7[0-9]{10}$'
    or coalesce(order_input ->> 'contact_method', '') not in ('telegram', 'whatsapp')
    or fulfillment not in ('delivery', 'pickup')
    or requested_date is null
    or requested_date < (now() at time zone 'Europe/Moscow')::date
    or requested_slot is null
    or not (selected_zone.delivery_intervals ? requested_slot) then
    raise exception 'CART_INVALID';
  end if;

  slot_start_hour := substring(requested_slot from '^([0-2][0-9]):')::integer;
  if slot_start_hour is null
    or (
      requested_date = (now() at time zone 'Europe/Moscow')::date
      and slot_start_hour < extract(hour from now() at time zone 'Europe/Moscow')::integer + 2
    ) then
    raise exception 'CART_INVALID';
  end if;

  if fulfillment = 'delivery'
    and (length(delivery_city) < 2 or length(delivery_address) < 5) then
    raise exception 'CART_INVALID';
  end if;
  if selected_zone.zone_type = 'moscow_district'
    and lower(regexp_replace(delivery_city, '^(г\.?\s*|город\s+)', '', 'i')) <> 'москва' then
    raise exception 'CART_DELIVERY';
  end if;
  if selected_zone.zone_type = 'region_city'
    and lower(regexp_replace(delivery_city, '^(г\.?\s*|город\s+)', '', 'i'))
      <> lower(selected_zone.name)
    and not exists (
      select 1
      from jsonb_array_elements_text(selected_zone.match_terms) as term(value)
      where lower(term.value) =
        lower(regexp_replace(delivery_city, '^(г\.?\s*|город\s+)', '', 'i'))
    ) then
    raise exception 'CART_DELIVERY';
  end if;
  if requested_urgent and not selected_zone.urgent_delivery_available then
    raise exception 'CART_DELIVERY';
  end if;
  if coalesce((order_input ->> 'recipient_is_different')::boolean, false)
    and (
      coalesce(length(trim(order_input ->> 'recipient_name')), 0) < 2
      or regexp_replace(coalesce(order_input ->> 'recipient_phone', ''), '\D', '', 'g') !~ '^7[0-9]{10}$'
    ) then
    raise exception 'CART_INVALID';
  end if;
  if coalesce((order_input ->> 'card_enabled')::boolean, false)
    and coalesce(length(trim(order_input ->> 'card_text')), 0) = 0 then
    raise exception 'CART_INVALID';
  end if;

  for input_item in
    select *
    from jsonb_to_recordset(order_input -> 'items')
      as item(product_id uuid, quantity integer, selected_options jsonb)
  loop
    if input_item.product_id is null
      or input_item.quantity is null
      or input_item.quantity < 1
      or input_item.quantity > 50
      or jsonb_typeof(input_item.selected_options) <> 'object' then
      raise exception 'CART_INVALID';
    end if;

    select * into current_product
    from public.products
    where id = input_item.product_id
      and publication_status = 'published'
    for share;
    if not found
      or current_product.availability_status = 'out_of_stock'
      or (
        current_product.stock_quantity is not null
        and current_product.stock_quantity < input_item.quantity
      ) then
      raise exception 'CART_UNAVAILABLE';
    end if;

    if exists (
      select 1
      from public.product_options option_definition
      where option_definition.product_id = current_product.id
        and option_definition.is_required
        and not (
          input_item.selected_options ? option_definition.id::text
        )
    ) then
      raise exception 'CART_INVALID';
    end if;

    select
      coalesce(array_agg((selected.value)::uuid), '{}'::uuid[]),
      coalesce(sum(option_value.price_modifier_kopecks), 0),
      coalesce(
        jsonb_object_agg(
          option_definition.code,
          jsonb_build_object(
            'name', option_definition.name,
            'value', option_value.label
          )
        ),
        '{}'::jsonb
      )
    into selected_value_ids, option_surcharge, selected_options_snapshot
    from jsonb_each_text(input_item.selected_options) selected
    join public.product_options option_definition
      on option_definition.id = (selected.key)::uuid
      and option_definition.product_id = current_product.id
    join public.product_option_values option_value
      on option_value.id = (selected.value)::uuid
      and option_value.option_id = option_definition.id;

    if coalesce(array_length(selected_value_ids, 1), 0)
      <> jsonb_object_length(input_item.selected_options) then
      raise exception 'CART_INVALID';
    end if;

    select exists (
      select 1
      from public.product_variants
      where product_id = current_product.id
        and is_active
    ) into has_sellable_variants;

    select * into current_variant
    from public.product_variants
    where product_id = current_product.id
      and is_active
      and option_value_ids @> selected_value_ids
      and selected_value_ids @> option_value_ids
    limit 1;

    if has_sellable_variants and not found then
      raise exception 'CART_UNAVAILABLE';
    end if;
    if found and (
      current_variant.availability_status = 'out_of_stock'
      or (
        current_variant.stock_quantity is not null
        and current_variant.stock_quantity < input_item.quantity
      )
    ) then
      raise exception 'CART_UNAVAILABLE';
    end if;

    unit_price :=
      coalesce(
        current_product.sale_price_kopecks,
        current_product.regular_price_kopecks
      )
      + option_surcharge
      + coalesce(current_variant.price_modifier_kopecks, 0);
    regular_unit_price :=
      current_product.regular_price_kopecks
      + option_surcharge
      + coalesce(current_variant.price_modifier_kopecks, 0);
    line_total := unit_price * input_item.quantity;
    calculated_items_total := calculated_items_total + line_total;
    calculated_discount :=
      calculated_discount
      + greatest(0, regular_unit_price - unit_price) * input_item.quantity;

    order_items_payload :=
      order_items_payload
      || jsonb_build_array(
        jsonb_build_object(
          'product_id', current_product.id,
          'variant_id', current_variant.id,
          'quantity', input_item.quantity,
          'unit_price_kopecks', unit_price,
          'line_total_kopecks', line_total,
          'product_snapshot', jsonb_build_object(
            'name', current_product.name,
            'sku', current_product.sku,
            'slug', current_product.slug
          ),
          'selected_options', selected_options_snapshot
        )
      );
  end loop;

  if calculated_items_total < selected_zone.minimum_order_kopecks then
    raise exception 'CART_DELIVERY';
  end if;

  price_pending := selected_zone.pricing_mode = 'manual';
  if price_pending then
    calculated_delivery := null;
    calculated_total := null;
  else
    calculated_delivery := case
      when selected_zone.zone_type = 'pickup' then 0
      when selected_zone.free_from_kopecks is not null
        and calculated_items_total >= selected_zone.free_from_kopecks then 0
      else selected_zone.base_price_kopecks
    end;
    if requested_urgent then
      calculated_delivery :=
        calculated_delivery + selected_zone.urgent_surcharge_kopecks;
    end if;
    calculated_total := calculated_items_total + calculated_delivery;
  end if;

  insert into public.customers (name, phone, email, metadata)
  values (
    trim(order_input ->> 'customer_name'),
    trim(order_input ->> 'customer_phone'),
    nullif(trim(order_input ->> 'customer_email'), ''),
    jsonb_build_object(
      'source', 'web_checkout',
      'contact_method', order_input ->> 'contact_method'
    )
  )
  returning id into customer_id;

  insert into public.orders (
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    contact_method,
    recipient_name,
    recipient_phone,
    comment,
    card_text,
    fulfillment_method,
    delivery_address,
    delivery_zone_id,
    delivery_zone_snapshot,
    delivery_price_pending,
    delivery_requires_confirmation,
    apartment_office,
    entrance,
    floor,
    intercom,
    requested_delivery_date,
    requested_delivery_slot,
    urgent_delivery,
    payment_method,
    items_total_kopecks,
    discount_kopecks,
    delivery_kopecks,
    total_kopecks,
    idempotency_key
  )
  values (
    customer_id,
    trim(order_input ->> 'customer_name'),
    trim(order_input ->> 'customer_phone'),
    nullif(trim(order_input ->> 'customer_email'), ''),
    order_input ->> 'contact_method',
    case
      when coalesce((order_input ->> 'recipient_is_different')::boolean, false)
        then trim(order_input ->> 'recipient_name')
      else null
    end,
    case
      when coalesce((order_input ->> 'recipient_is_different')::boolean, false)
        then trim(order_input ->> 'recipient_phone')
      else null
    end,
    coalesce(order_input ->> 'comment', ''),
    case
      when coalesce((order_input ->> 'card_enabled')::boolean, false)
        then trim(order_input ->> 'card_text')
      else null
    end,
    fulfillment,
    jsonb_build_object('city', delivery_city, 'address', delivery_address),
    selected_zone.id,
    jsonb_build_object(
      'id', selected_zone.id,
      'name', selected_zone.name,
      'slug', selected_zone.slug,
      'zone_type', selected_zone.zone_type,
      'pricing_mode', selected_zone.pricing_mode,
      'base_price_kopecks', selected_zone.base_price_kopecks,
      'free_from_kopecks', selected_zone.free_from_kopecks,
      'minimum_order_kopecks', selected_zone.minimum_order_kopecks,
      'urgent_surcharge_kopecks', selected_zone.urgent_surcharge_kopecks
    ),
    price_pending,
    selected_zone.requires_manager_confirmation or price_pending,
    trim(coalesce(order_input ->> 'apartment_office', '')),
    trim(coalesce(order_input ->> 'entrance', '')),
    trim(coalesce(order_input ->> 'floor', '')),
    trim(coalesce(order_input ->> 'intercom', '')),
    requested_date,
    requested_slot,
    requested_urgent,
    coalesce(order_input ->> 'payment_method', 'on_confirmation'),
    calculated_items_total,
    calculated_discount,
    calculated_delivery,
    calculated_total,
    request_key
  )
  returning * into created_order;

  for order_item in
    select value from jsonb_array_elements(order_items_payload)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price_kopecks,
      line_total_kopecks,
      product_snapshot,
      selected_options
    )
    values (
      created_order.id,
      (order_item ->> 'product_id')::uuid,
      (order_item ->> 'variant_id')::uuid,
      (order_item ->> 'quantity')::integer,
      (order_item ->> 'unit_price_kopecks')::bigint,
      (order_item ->> 'line_total_kopecks')::bigint,
      order_item -> 'product_snapshot',
      order_item -> 'selected_options'
    );
  end loop;

  return query
    select
      created_order.id,
      created_order.order_number,
      created_order.public_token,
      created_order.items_total_kopecks,
      created_order.discount_kopecks,
      coalesce(created_order.delivery_kopecks, 0),
      coalesce(created_order.total_kopecks, created_order.items_total_kopecks),
      created_order.delivery_price_pending;
end;
$$;

drop function if exists public.get_public_order_summary(uuid);

create function public.get_public_order_summary(order_token uuid)
returns table (
  order_number bigint,
  status text,
  items_total_kopecks bigint,
  delivery_kopecks bigint,
  total_kopecks bigint,
  delivery_price_pending boolean,
  delivery_zone_name text,
  fulfillment_method text,
  requested_delivery_date date,
  requested_delivery_slot text
)
language sql
security definer
set search_path = ''
as $$
  select
    o.order_number,
    o.status,
    o.items_total_kopecks,
    o.delivery_kopecks,
    o.total_kopecks,
    o.delivery_price_pending,
    coalesce(o.delivery_zone_snapshot ->> 'name', ''),
    o.fulfillment_method,
    o.requested_delivery_date,
    o.requested_delivery_slot
  from public.orders o
  where o.public_token = order_token
  limit 1;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;
revoke all on function public.get_public_order_summary(uuid) from public;
grant execute on function public.get_public_order_summary(uuid) to anon, authenticated;

commit;
