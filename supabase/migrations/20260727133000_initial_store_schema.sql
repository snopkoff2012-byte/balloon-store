-- Воздушная Москва: базовая схема каталога, заказов и настроек.
-- Денежные значения хранятся целым числом копеек, даты — timestamptz.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'manager'
    check (role in ('admin', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null default '',
  full_description text not null default '',
  image_path text not null default '',
  parent_id uuid references public.categories(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'hidden')),
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_parent_not_self check (parent_id is null or parent_id <> id)
);

create table public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sku text not null,
  product_type text not null default 'simple'
    check (product_type in ('simple', 'composition')),
  short_description text not null default '',
  full_description text not null default '',
  regular_price_kopecks bigint not null check (regular_price_kopecks >= 0),
  sale_price_kopecks bigint check (
    sale_price_kopecks is null or sale_price_kopecks >= 0
  ),
  cost_price_kopecks bigint check (
    cost_price_kopecks is null or cost_price_kopecks >= 0
  ),
  primary_category_id uuid not null references public.categories(id) on delete restrict,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  availability_status text not null default 'in_stock'
    check (
      availability_status in (
        'in_stock',
        'limited',
        'out_of_stock',
        'preorder'
      )
    ),
  is_made_to_order boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  is_recommended boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  attributes jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attributes) = 'array'),
  seo_title text not null default '',
  seo_description text not null default '',
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, storage_path)
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, category_id)
);

create table public.product_options (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  option_type text not null default 'select'
    check (option_type in ('select', 'multiselect', 'text', 'number', 'boolean')),
  is_required boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, code)
);

create table public.product_option_values (
  id uuid primary key default extensions.gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  label text not null,
  value text not null,
  price_modifier_kopecks bigint not null default 0,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (option_id, value)
);

create table public.product_variants (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  option_value_ids uuid[] not null default '{}',
  price_modifier_kopecks bigint not null default 0,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  availability_status text not null default 'in_stock'
    check (
      availability_status in (
        'in_stock',
        'limited',
        'out_of_stock',
        'preorder'
      )
    ),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, sku)
);

create table public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.delivery_zones (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  base_price_kopecks bigint not null default 0 check (base_price_kopecks >= 0),
  price_per_km_kopecks bigint not null default 0
    check (price_per_km_kopecks >= 0),
  free_from_kopecks bigint check (
    free_from_kopecks is null or free_from_kopecks >= 0
  ),
  geometry jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.promo_codes (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value bigint not null check (discount_value > 0),
  minimum_order_kopecks bigint not null default 0
    check (minimum_order_kopecks >= 0),
  maximum_discount_kopecks bigint check (
    maximum_discount_kopecks is null or maximum_discount_kopecks >= 0
  ),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint promo_codes_period_valid check (
    starts_at is null or ends_at is null or starts_at < ends_at
  )
);

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  order_number bigint generated by default as identity unique,
  public_token uuid not null default extensions.gen_random_uuid() unique,
  customer_id uuid references public.customers(id) on delete set null,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  status text not null default 'new'
    check (
      status in (
        'new',
        'confirmed',
        'assembling',
        'ready',
        'out_for_delivery',
        'completed',
        'cancelled'
      )
    ),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  comment text not null default '',
  delivery_address jsonb not null default '{}'::jsonb
    check (jsonb_typeof(delivery_address) = 'object'),
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  requested_delivery_date date,
  requested_delivery_slot text,
  items_total_kopecks bigint not null default 0 check (items_total_kopecks >= 0),
  discount_kopecks bigint not null default 0 check (discount_kopecks >= 0),
  delivery_kopecks bigint check (
    delivery_kopecks is null or delivery_kopecks >= 0
  ),
  total_kopecks bigint check (total_kopecks is null or total_kopecks >= 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  idempotency_key text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price_kopecks bigint not null check (unit_price_kopecks >= 0),
  line_total_kopecks bigint not null check (line_total_kopecks >= 0),
  product_snapshot jsonb not null check (jsonb_typeof(product_snapshot) = 'object'),
  selected_options jsonb not null default '{}'::jsonb
    check (jsonb_typeof(selected_options) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  value jsonb not null,
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.constructor_items (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete restrict,
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  maximum_quantity integer check (
    maximum_quantity is null or maximum_quantity >= minimum_quantity
  ),
  is_required boolean not null default true,
  group_code text not null default 'default',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, component_product_id),
  constraint constructor_item_not_self check (product_id <> component_product_id)
);

-- Индексы каталога, поиска, сортировки и связей.
create unique index categories_slug_lower_uidx
  on public.categories (lower(slug));
create index categories_parent_sort_idx
  on public.categories (parent_id, sort_order);
create index categories_publication_sort_idx
  on public.categories (publication_status, sort_order);

create unique index products_slug_lower_uidx
  on public.products (lower(slug));
create unique index products_sku_lower_uidx
  on public.products (lower(sku));
create index products_primary_category_idx
  on public.products (primary_category_id);
create index products_public_catalog_idx
  on public.products (publication_status, sort_order, created_at desc);
create index products_availability_idx
  on public.products (availability_status)
  where publication_status = 'published';
create index products_featured_idx
  on public.products (is_bestseller, is_new, is_recommended, sort_order)
  where publication_status = 'published';
create index products_attributes_gin_idx
  on public.products using gin (attributes jsonb_path_ops);
create index products_search_idx
  on public.products using gin (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(full_description, '')
    )
  );

create index product_images_product_sort_idx
  on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_uidx
  on public.product_images (product_id)
  where is_primary;
create index product_categories_category_product_idx
  on public.product_categories (category_id, product_id);
create unique index product_categories_one_primary_uidx
  on public.product_categories (product_id)
  where is_primary;
create index product_options_product_sort_idx
  on public.product_options (product_id, sort_order);
create index product_option_values_option_sort_idx
  on public.product_option_values (option_id, sort_order);
create index product_variants_product_active_idx
  on public.product_variants (product_id, is_active);
create index product_variants_option_values_gin_idx
  on public.product_variants using gin (option_value_ids);

create index customers_phone_idx on public.customers (phone);
create index customers_email_lower_idx on public.customers (lower(email));
create unique index delivery_zones_slug_lower_uidx
  on public.delivery_zones (lower(slug));
create index delivery_zones_active_sort_idx
  on public.delivery_zones (is_active, sort_order);
create unique index promo_codes_code_lower_uidx
  on public.promo_codes (lower(code));
create index promo_codes_active_period_idx
  on public.promo_codes (is_active, starts_at, ends_at);
create index orders_status_created_idx
  on public.orders (status, created_at desc);
create index orders_customer_created_idx
  on public.orders (customer_id, created_at desc);
create index orders_phone_created_idx
  on public.orders (customer_phone, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index constructor_items_product_sort_idx
  on public.constructor_items (product_id, sort_order);
create index constructor_items_component_idx
  on public.constructor_items (component_product_id);

-- Автоматическое updated_at для всех изменяемых сущностей.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_profiles',
    'categories',
    'products',
    'product_images',
    'product_categories',
    'product_options',
    'product_option_values',
    'product_variants',
    'customers',
    'delivery_zones',
    'promo_codes',
    'orders',
    'order_items',
    'site_settings',
    'constructor_items'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

-- Роль администратора хранится в таблице, которую пользователь не может
-- изменить сам. Первую запись создаёт владелец проекта через SQL Editor.
create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = (select auth.uid())
      and is_active
      and role in ('admin', 'manager')
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

-- RLS включён для каждой таблицы, доступной через API.
alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.constructor_items enable row level security;

-- Явные SQL-права дополняют RLS.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories,
  public.products,
  public.product_images,
  public.product_categories,
  public.product_options,
  public.product_option_values,
  public.product_variants,
  public.constructor_items
to anon;
grant select, insert, update, delete on all tables in schema public
to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Посетитель видит только опубликованный каталог и связанные с ним данные.
create policy "public_read_published_categories"
on public.categories for select
to anon
using (publication_status = 'published');

create policy "public_read_published_products"
on public.products for select
to anon
using (publication_status = 'published');

create policy "public_read_images_of_published_products"
on public.product_images for select
to anon
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.publication_status = 'published'
  )
);

create policy "public_read_categories_of_published_products"
on public.product_categories for select
to anon
using (
  exists (
    select 1
    from public.products
    where products.id = product_categories.product_id
      and products.publication_status = 'published'
  )
  and exists (
    select 1
    from public.categories
    where categories.id = product_categories.category_id
      and categories.publication_status = 'published'
  )
);

create policy "public_read_options_of_published_products"
on public.product_options for select
to anon
using (
  exists (
    select 1
    from public.products
    where products.id = product_options.product_id
      and products.publication_status = 'published'
  )
);

create policy "public_read_option_values_of_published_products"
on public.product_option_values for select
to anon
using (
  exists (
    select 1
    from public.product_options
    join public.products on products.id = product_options.product_id
    where product_options.id = product_option_values.option_id
      and products.publication_status = 'published'
  )
);

create policy "public_read_active_variants_of_published_products"
on public.product_variants for select
to anon
using (
  is_active
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.publication_status = 'published'
  )
);

create policy "public_read_constructor_of_published_products"
on public.constructor_items for select
to anon
using (
  exists (
    select 1
    from public.products
    where products.id = constructor_items.product_id
      and products.publication_status = 'published'
  )
  and exists (
    select 1
    from public.products component
    where component.id = constructor_items.component_product_id
      and component.publication_status = 'published'
  )
);

-- Пользователь может прочитать только собственный профиль; все данные каталога,
-- клиентов и заказов целиком доступны только активному администратору.
create policy "authenticated_read_own_admin_profile"
on public.admin_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_profiles',
    'categories',
    'products',
    'product_images',
    'product_categories',
    'product_options',
    'product_option_values',
    'product_variants',
    'customers',
    'delivery_zones',
    'promo_codes',
    'orders',
    'order_items',
    'site_settings',
    'constructor_items'
  ]
  loop
    execute format(
      'create policy "active_admin_manage_%1$s"
       on public.%1$I for all
       to authenticated
       using ((select public.is_active_admin()))
       with check ((select public.is_active_admin()))',
      table_name
    );
  end loop;
end;
$$;

-- Storage: публичный бакет для готовых изображений каталога; записывать,
-- заменять и удалять файлы может только активный администратор.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public_read_catalog_images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'catalog-images');

create policy "active_admin_upload_catalog_images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catalog-images'
  and (select public.is_active_admin())
);

create policy "active_admin_update_catalog_images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'catalog-images'
  and (select public.is_active_admin())
)
with check (
  bucket_id = 'catalog-images'
  and (select public.is_active_admin())
);

create policy "active_admin_delete_catalog_images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catalog-images'
  and (select public.is_active_admin())
);
