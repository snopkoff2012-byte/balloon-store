begin;

-- Заказ и попытка оплаты — разные сущности. Один заказ может получить новую
-- ссылку после отменённой, неудачной или истёкшей попытки.
create table if not exists public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  public_token uuid not null default extensions.gen_random_uuid() unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('mock', 'yookassa', 'tbank')),
  payment_method text not null check (payment_method in ('bank_card', 'sbp')),
  status text not null default 'creating' check (
    status in (
      'creating',
      'pending',
      'succeeded',
      'canceled',
      'failed',
      'refunded'
    )
  ),
  provider_status text not null default '',
  amount_kopecks bigint not null check (amount_kopecks > 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  external_id text,
  confirmation_url text,
  idempotency_key text not null unique,
  test_mode boolean not null default true,
  failure_code text,
  failure_message text,
  expires_at timestamptz,
  confirmed_at timestamptz,
  canceled_at timestamptz,
  failed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider, external_id)
);

-- Храним только безопасное краткое содержание события, а не платёжные
-- реквизиты и не полный ответ провайдера.
create table if not exists public.payment_events (
  id uuid primary key default extensions.gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('mock', 'yookassa', 'tbank')),
  provider_event_id text not null,
  event_type text not null,
  status_from text,
  status_to text,
  verified boolean not null default false,
  test_mode boolean not null default true,
  failure_code text,
  failure_message text,
  safe_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(safe_payload) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_event_id)
);

create index if not exists payments_order_created_idx
  on public.payments (order_id, created_at desc);
create index if not exists payments_provider_external_idx
  on public.payments (provider, external_id);
create index if not exists payments_status_updated_idx
  on public.payments (status, updated_at desc);
create unique index if not exists payments_one_active_per_order_idx
  on public.payments (order_id)
  where status in ('creating', 'pending');
create index if not exists payment_events_payment_created_idx
  on public.payment_events (payment_id, created_at desc);
create index if not exists payment_events_order_created_idx
  on public.payment_events (order_id, created_at desc);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

revoke all on public.payments, public.payment_events from anon, authenticated;
grant select, insert, update on public.payments to authenticated;
grant select, insert on public.payment_events to authenticated;

drop policy if exists "active_admin_read_payments" on public.payments;
create policy "active_admin_read_payments"
on public.payments for select
to authenticated
using ((select public.is_active_admin()));

drop policy if exists "active_admin_create_payments" on public.payments;
create policy "active_admin_create_payments"
on public.payments for insert
to authenticated
with check (
  (select public.is_active_admin())
  and created_by = (select auth.uid())
);

drop policy if exists "active_admin_update_payments" on public.payments;
create policy "active_admin_update_payments"
on public.payments for update
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "active_admin_read_payment_events"
  on public.payment_events;
create policy "active_admin_read_payment_events"
on public.payment_events for select
to authenticated
using ((select public.is_active_admin()));

drop policy if exists "active_admin_create_payment_events"
  on public.payment_events;
create policy "active_admin_create_payment_events"
on public.payment_events for insert
to authenticated
with check ((select public.is_active_admin()));

-- Применение проверенного webhook и запись события происходят в одной
-- транзакции. Одинаковый provider_event_id второй раз ничего не меняет.
create or replace function public.apply_verified_payment_webhook(
  input_provider text,
  input_external_id text,
  input_event_id text,
  input_status text,
  input_provider_status text,
  input_failure_code text default null,
  input_failure_message text default null,
  input_safe_payload jsonb default '{}'::jsonb
)
returns table (
  applied boolean,
  duplicate boolean,
  payment_id uuid,
  order_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_payment public.payments%rowtype;
  next_status text;
  inserted_event_id uuid;
begin
  if input_provider not in ('mock', 'yookassa', 'tbank')
    or input_status not in (
      'pending',
      'succeeded',
      'canceled',
      'failed',
      'refunded'
    )
    or coalesce(length(input_external_id), 0) = 0
    or coalesce(length(input_event_id), 0) = 0
    or jsonb_typeof(coalesce(input_safe_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'PAYMENT_WEBHOOK_INVALID';
  end if;

  select *
  into current_payment
  from public.payments as payment
  where payment.provider = input_provider
    and payment.external_id = input_external_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  next_status := input_status;
  if current_payment.status = 'refunded' then
    next_status := 'refunded';
  elsif current_payment.status = 'succeeded'
    and input_status in ('pending', 'canceled', 'failed') then
    next_status := 'succeeded';
  elsif current_payment.status in ('canceled', 'failed')
    and input_status = 'pending' then
    next_status := current_payment.status;
  end if;

  insert into public.payment_events (
    payment_id,
    order_id,
    provider,
    provider_event_id,
    event_type,
    status_from,
    status_to,
    verified,
    test_mode,
    failure_code,
    failure_message,
    safe_payload
  )
  values (
    current_payment.id,
    current_payment.order_id,
    current_payment.provider,
    input_event_id,
    'webhook',
    current_payment.status,
    next_status,
    true,
    current_payment.test_mode,
    input_failure_code,
    input_failure_message,
    coalesce(input_safe_payload, '{}'::jsonb)
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return query
      select false, true, current_payment.id, current_payment.order_id;
    return;
  end if;

  update public.payments
  set
    status = next_status,
    provider_status = coalesce(input_provider_status, ''),
    failure_code = case
      when next_status = 'failed' then input_failure_code
      else failure_code
    end,
    failure_message = case
      when next_status = 'failed' then input_failure_message
      else failure_message
    end,
    confirmed_at = case
      when next_status = 'succeeded'
        then coalesce(confirmed_at, timezone('utc', now()))
      else confirmed_at
    end,
    canceled_at = case
      when next_status = 'canceled'
        then coalesce(canceled_at, timezone('utc', now()))
      else canceled_at
    end,
    failed_at = case
      when next_status = 'failed'
        then coalesce(failed_at, timezone('utc', now()))
      else failed_at
    end
  where id = current_payment.id;

  update public.orders
  set
    payment_status = case
      when next_status = 'succeeded' then 'paid'
      when next_status = 'refunded' then 'refunded'
      when next_status in ('failed', 'canceled') then 'failed'
      else 'awaiting'
    end,
    paid_at = case
      when next_status = 'succeeded'
        then coalesce(paid_at, timezone('utc', now()))
      else paid_at
    end,
    status = case
      when next_status = 'succeeded'
        and status in ('new', 'confirmed', 'awaiting_payment')
        then 'paid'
      else status
    end
  where id = current_payment.order_id;

  return query
    select true, false, current_payment.id, current_payment.order_id;
end;
$$;

revoke all on function public.apply_verified_payment_webhook(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) from public;
grant execute on function public.apply_verified_payment_webhook(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;

-- Публичная страница видит только безопасное состояние по непредсказуемому
-- токену заказа. Сам факт возврата на страницу никак не меняет статус.
create or replace function public.get_public_payment_summary(order_token uuid)
returns table (
  order_number bigint,
  payment_status text,
  provider text,
  payment_method text,
  test_mode boolean,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    orders.order_number,
    coalesce(latest_payment.status, 'not_created'),
    latest_payment.provider,
    latest_payment.payment_method,
    coalesce(latest_payment.test_mode, false),
    latest_payment.updated_at
  from public.orders as orders
  left join lateral (
    select payment.*
    from public.payments as payment
    where payment.order_id = orders.id
    order by payment.created_at desc
    limit 1
  ) as latest_payment on true
  where orders.public_token = order_token
  limit 1;
$$;

revoke all on function public.get_public_payment_summary(uuid) from public;
grant execute on function public.get_public_payment_summary(uuid)
  to anon, authenticated;

-- Данные тестовой страницы доступны только по отдельному токену попытки и
-- только для MockPaymentProvider.
create or replace function public.get_mock_payment_checkout(payment_token uuid)
returns table (
  order_number bigint,
  order_token uuid,
  amount_kopecks bigint,
  payment_status text,
  payment_method text,
  expires_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    orders.order_number,
    orders.public_token,
    payment.amount_kopecks,
    payment.status,
    payment.payment_method,
    payment.expires_at
  from public.payments as payment
  join public.orders as orders on orders.id = payment.order_id
  where payment.public_token = payment_token
    and payment.provider = 'mock'
    and payment.test_mode
  limit 1;
$$;

revoke all on function public.get_mock_payment_checkout(uuid) from public;
grant execute on function public.get_mock_payment_checkout(uuid)
  to anon, authenticated;

commit;
