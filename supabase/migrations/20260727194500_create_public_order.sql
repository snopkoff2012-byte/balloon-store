begin;

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
  existing_order public.orders%rowtype;
  request_key text;
begin
  if jsonb_typeof(order_input) <> 'object'
    or jsonb_typeof(order_input -> 'items') <> 'array'
    or jsonb_array_length(order_input -> 'items') = 0 then
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
      coalesce(existing_order.total_kopecks, existing_order.items_total_kopecks);
    return;
  end if;

  if coalesce(length(trim(order_input ->> 'customer_name')), 0) < 2
    or coalesce(length(trim(order_input ->> 'customer_phone')), 0) < 10
    or coalesce(length(trim(order_input ->> 'city')), 0) < 2
    or coalesce(length(trim(order_input ->> 'address')), 0) < 5 then
    raise exception 'CART_INVALID';
  end if;

  for input_item in
    select *
    from jsonb_to_recordset(order_input -> 'items') as item(
      product_id uuid,
      quantity integer,
      selected_options jsonb
    )
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

    if not found or current_product.availability_status = 'out_of_stock' then
      raise exception 'CART_UNAVAILABLE';
    end if;

    if current_product.stock_quantity is not null
      and current_product.stock_quantity < input_item.quantity then
      raise exception 'CART_UNAVAILABLE';
    end if;

    if exists (
      select 1
      from public.product_options option_definition
      where option_definition.product_id = current_product.id
        and option_definition.is_required
        and not (input_item.selected_options ? option_definition.id::text)
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

    unit_price := coalesce(current_product.sale_price_kopecks, current_product.regular_price_kopecks)
      + option_surcharge
      + coalesce(current_variant.price_modifier_kopecks, 0);
    regular_unit_price := current_product.regular_price_kopecks
      + option_surcharge
      + coalesce(current_variant.price_modifier_kopecks, 0);
    line_total := unit_price * input_item.quantity;
    calculated_items_total := calculated_items_total + line_total;
    calculated_discount := calculated_discount
      + greatest(0, regular_unit_price - unit_price) * input_item.quantity;

    order_items_payload := order_items_payload || jsonb_build_array(
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

  calculated_delivery := case
    when calculated_items_total >= 700000 then 0
    else 69000
  end;
  calculated_total := calculated_items_total + calculated_delivery;

  insert into public.customers (name, phone, email, metadata)
  values (
    trim(order_input ->> 'customer_name'),
    trim(order_input ->> 'customer_phone'),
    nullif(trim(order_input ->> 'customer_email'), ''),
    jsonb_build_object('source', 'web_checkout')
  )
  returning id into customer_id;

  insert into public.orders (
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    comment,
    delivery_address,
    requested_delivery_date,
    requested_delivery_slot,
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
    coalesce(order_input ->> 'comment', ''),
    jsonb_build_object(
      'city', trim(order_input ->> 'city'),
      'address', trim(order_input ->> 'address')
    ),
    nullif(order_input ->> 'requested_delivery_date', '')::date,
    nullif(order_input ->> 'requested_delivery_slot', ''),
    calculated_items_total,
    calculated_discount,
    calculated_delivery,
    calculated_total,
    request_key
  )
  returning * into created_order;

  for order_item in select value from jsonb_array_elements(order_items_payload)
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
    coalesce(created_order.total_kopecks, created_order.items_total_kopecks);
end;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;

commit;
