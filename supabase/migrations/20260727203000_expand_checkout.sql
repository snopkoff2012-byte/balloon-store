begin;

-- Детали оформления хранятся отдельно от платёжных реквизитов: номера карт и CVC
-- не принимаются приложением и в базу не попадают.
alter table public.orders
  add column if not exists contact_method text not null default 'telegram',
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists card_text text,
  add column if not exists fulfillment_method text not null default 'delivery',
  add column if not exists apartment_office text not null default '',
  add column if not exists entrance text not null default '',
  add column if not exists floor text not null default '',
  add column if not exists intercom text not null default '';

alter table public.orders
  drop constraint if exists orders_contact_method_check,
  add constraint orders_contact_method_check check (contact_method in ('telegram', 'whatsapp')),
  drop constraint if exists orders_fulfillment_method_check,
  add constraint orders_fulfillment_method_check check (fulfillment_method in ('delivery', 'pickup'));

update public.orders
set status = case status
  when 'assembling' then 'preparing'
  when 'ready' then 'preparing'
  when 'out_for_delivery' then 'handed_to_courier'
  else status
end;

alter table public.orders
  drop constraint if exists orders_status_check,
  add constraint orders_status_check check (status in (
    'new', 'confirmed', 'awaiting_payment', 'paid', 'preparing',
    'handed_to_courier', 'completed', 'cancelled'
  ));

update public.order_status_history
set status = case status
  when 'assembling' then 'preparing'
  when 'ready' then 'preparing'
  when 'out_for_delivery' then 'handed_to_courier'
  else status
end;

alter table public.order_status_history
  drop constraint if exists order_status_history_status_check,
  add constraint order_status_history_status_check check (status in (
    'new', 'confirmed', 'awaiting_payment', 'paid', 'preparing',
    'handed_to_courier', 'completed', 'cancelled'
  ));

create index if not exists orders_fulfillment_status_created_idx
  on public.orders (fulfillment_method, status, created_at desc);

create or replace function public.create_public_order(order_input jsonb)
returns table (
  order_id uuid,
  order_number bigint,
  public_token uuid,
  items_total_kopecks bigint,
  discount_kopecks bigint,
  delivery_kopecks bigint,
  total_kopecks bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  input_item record;
  current_product public.products%rowtype;
  current_variant public.product_variants%rowtype;
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
  if request_key is null or length(request_key) < 16 then raise exception 'CART_INVALID'; end if;
  select * into existing_order from public.orders where idempotency_key = request_key;
  if found then
    return query select existing_order.id, existing_order.order_number, existing_order.public_token,
      existing_order.items_total_kopecks, existing_order.discount_kopecks,
      coalesce(existing_order.delivery_kopecks, 0), coalesce(existing_order.total_kopecks, existing_order.items_total_kopecks);
    return;
  end if;

  fulfillment := coalesce(order_input ->> 'fulfillment_method', '');
  requested_date := nullif(order_input ->> 'requested_delivery_date', '')::date;
  requested_slot := nullif(trim(order_input ->> 'requested_delivery_slot'), '');
  delivery_city := trim(coalesce(order_input ->> 'city', ''));
  delivery_address := trim(coalesce(order_input ->> 'address', ''));
  if coalesce(length(trim(order_input ->> 'customer_name')), 0) < 2
    or regexp_replace(coalesce(order_input ->> 'customer_phone', ''), '\D', '', 'g') !~ '^7[0-9]{10}$'
    or coalesce(order_input ->> 'contact_method', '') not in ('telegram', 'whatsapp')
    or fulfillment not in ('delivery', 'pickup')
    or requested_date is null or requested_date < (now() at time zone 'Europe/Moscow')::date
    or requested_slot not in ('10:00–13:00', '13:00–16:00', '16:00–19:00', '19:00–22:00') then
    raise exception 'CART_INVALID';
  end if;
  if requested_date = (now() at time zone 'Europe/Moscow')::date and
    ((requested_slot = '10:00–13:00' and (now() at time zone 'Europe/Moscow')::time >= time '08:00')
      or (requested_slot = '13:00–16:00' and (now() at time zone 'Europe/Moscow')::time >= time '11:00')
      or (requested_slot = '16:00–19:00' and (now() at time zone 'Europe/Moscow')::time >= time '14:00')
      or (requested_slot = '19:00–22:00' and (now() at time zone 'Europe/Moscow')::time >= time '17:00')) then
    raise exception 'CART_INVALID';
  end if;
  if fulfillment = 'delivery' and (length(delivery_city) < 2 or length(delivery_address) < 5) then raise exception 'CART_INVALID'; end if;
  if coalesce((order_input ->> 'recipient_is_different')::boolean, false) and
    (coalesce(length(trim(order_input ->> 'recipient_name')), 0) < 2
      or regexp_replace(coalesce(order_input ->> 'recipient_phone', ''), '\D', '', 'g') !~ '^7[0-9]{10}$') then raise exception 'CART_INVALID'; end if;
  if coalesce((order_input ->> 'card_enabled')::boolean, false) and coalesce(length(trim(order_input ->> 'card_text')), 0) = 0 then raise exception 'CART_INVALID'; end if;

  for input_item in select * from jsonb_to_recordset(order_input -> 'items') as item(product_id uuid, quantity integer, selected_options jsonb) loop
    if input_item.product_id is null or input_item.quantity is null or input_item.quantity < 1 or input_item.quantity > 50 or jsonb_typeof(input_item.selected_options) <> 'object' then raise exception 'CART_INVALID'; end if;
    select * into current_product from public.products where id = input_item.product_id and publication_status = 'published' for share;
    if not found or current_product.availability_status = 'out_of_stock' then raise exception 'CART_UNAVAILABLE'; end if;
    if current_product.stock_quantity is not null and current_product.stock_quantity < input_item.quantity then raise exception 'CART_UNAVAILABLE'; end if;
    if exists (select 1 from public.product_options option_definition where option_definition.product_id = current_product.id and option_definition.is_required and not (input_item.selected_options ? option_definition.id::text)) then raise exception 'CART_INVALID'; end if;
    select coalesce(array_agg((selected.value)::uuid), '{}'::uuid[]), coalesce(sum(option_value.price_modifier_kopecks), 0), coalesce(jsonb_object_agg(option_definition.code, jsonb_build_object('name', option_definition.name, 'value', option_value.label)), '{}'::jsonb)
    into selected_value_ids, option_surcharge, selected_options_snapshot
    from jsonb_each_text(input_item.selected_options) selected
    join public.product_options option_definition on option_definition.id = (selected.key)::uuid and option_definition.product_id = current_product.id
    join public.product_option_values option_value on option_value.id = (selected.value)::uuid and option_value.option_id = option_definition.id;
    if coalesce(array_length(selected_value_ids, 1), 0) <> jsonb_object_length(input_item.selected_options) then raise exception 'CART_INVALID'; end if;
    select exists (select 1 from public.product_variants where product_id = current_product.id and is_active) into has_sellable_variants;
    select * into current_variant from public.product_variants where product_id = current_product.id and is_active and option_value_ids @> selected_value_ids and selected_value_ids @> option_value_ids limit 1;
    if has_sellable_variants and not found then raise exception 'CART_UNAVAILABLE'; end if;
    if found and (current_variant.availability_status = 'out_of_stock' or (current_variant.stock_quantity is not null and current_variant.stock_quantity < input_item.quantity)) then raise exception 'CART_UNAVAILABLE'; end if;
    unit_price := coalesce(current_product.sale_price_kopecks, current_product.regular_price_kopecks) + option_surcharge + coalesce(current_variant.price_modifier_kopecks, 0);
    regular_unit_price := current_product.regular_price_kopecks + option_surcharge + coalesce(current_variant.price_modifier_kopecks, 0);
    line_total := unit_price * input_item.quantity;
    calculated_items_total := calculated_items_total + line_total;
    calculated_discount := calculated_discount + greatest(0, regular_unit_price - unit_price) * input_item.quantity;
    order_items_payload := order_items_payload || jsonb_build_array(jsonb_build_object('product_id', current_product.id, 'variant_id', current_variant.id, 'quantity', input_item.quantity, 'unit_price_kopecks', unit_price, 'line_total_kopecks', line_total, 'product_snapshot', jsonb_build_object('name', current_product.name, 'sku', current_product.sku, 'slug', current_product.slug), 'selected_options', selected_options_snapshot));
  end loop;

  calculated_delivery := case when fulfillment = 'pickup' then 0 when calculated_items_total >= 700000 then 0 else 69000 end + case when fulfillment = 'delivery' and coalesce((order_input ->> 'urgent_delivery')::boolean, false) then 50000 else 0 end;
  calculated_total := calculated_items_total + calculated_delivery;
  insert into public.customers (name, phone, email, metadata) values (trim(order_input ->> 'customer_name'), trim(order_input ->> 'customer_phone'), nullif(trim(order_input ->> 'customer_email'), ''), jsonb_build_object('source', 'web_checkout', 'contact_method', order_input ->> 'contact_method')) returning id into customer_id;
  insert into public.orders (customer_id, customer_name, customer_phone, customer_email, contact_method, recipient_name, recipient_phone, comment, card_text, fulfillment_method, delivery_address, apartment_office, entrance, floor, intercom, requested_delivery_date, requested_delivery_slot, urgent_delivery, payment_method, items_total_kopecks, discount_kopecks, delivery_kopecks, total_kopecks, idempotency_key)
  values (customer_id, trim(order_input ->> 'customer_name'), trim(order_input ->> 'customer_phone'), nullif(trim(order_input ->> 'customer_email'), ''), order_input ->> 'contact_method', case when coalesce((order_input ->> 'recipient_is_different')::boolean, false) then trim(order_input ->> 'recipient_name') else null end, case when coalesce((order_input ->> 'recipient_is_different')::boolean, false) then trim(order_input ->> 'recipient_phone') else null end, coalesce(order_input ->> 'comment', ''), case when coalesce((order_input ->> 'card_enabled')::boolean, false) then trim(order_input ->> 'card_text') else null end, fulfillment, jsonb_build_object('city', delivery_city, 'address', delivery_address), trim(coalesce(order_input ->> 'apartment_office', '')), trim(coalesce(order_input ->> 'entrance', '')), trim(coalesce(order_input ->> 'floor', '')), trim(coalesce(order_input ->> 'intercom', '')), requested_date, requested_slot, coalesce((order_input ->> 'urgent_delivery')::boolean, false), coalesce(order_input ->> 'payment_method', 'on_confirmation'), calculated_items_total, calculated_discount, calculated_delivery, calculated_total, request_key) returning * into created_order;
  for order_item in select value from jsonb_array_elements(order_items_payload) loop
    insert into public.order_items (order_id, product_id, variant_id, quantity, unit_price_kopecks, line_total_kopecks, product_snapshot, selected_options) values (created_order.id, (order_item ->> 'product_id')::uuid, (order_item ->> 'variant_id')::uuid, (order_item ->> 'quantity')::integer, (order_item ->> 'unit_price_kopecks')::bigint, (order_item ->> 'line_total_kopecks')::bigint, order_item -> 'product_snapshot', order_item -> 'selected_options');
  end loop;
  return query select created_order.id, created_order.order_number, created_order.public_token, created_order.items_total_kopecks, created_order.discount_kopecks, coalesce(created_order.delivery_kopecks, 0), coalesce(created_order.total_kopecks, created_order.items_total_kopecks);
end;
$$;

create or replace function public.get_public_order_summary(order_token uuid)
returns table (order_number bigint, status text, total_kopecks bigint, fulfillment_method text, requested_delivery_date date, requested_delivery_slot text)
language sql security definer set search_path = '' as $$
  select o.order_number, o.status, coalesce(o.total_kopecks, o.items_total_kopecks), o.fulfillment_method, o.requested_delivery_date, o.requested_delivery_slot
  from public.orders o where o.public_token = order_token limit 1;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;
revoke all on function public.get_public_order_summary(uuid) from public;
grant execute on function public.get_public_order_summary(uuid) to anon, authenticated;

commit;
