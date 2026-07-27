begin;

-- Дополнительные поля, необходимые административной панели заказов и доставки.
alter table public.orders
  add column if not exists manager_comment text not null default '',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text not null default 'on_confirmation',
  add column if not exists delivery_status text not null default 'not_scheduled',
  add column if not exists urgent_delivery boolean not null default false,
  add column if not exists paid_at timestamptz;

alter table public.orders
  drop constraint if exists orders_payment_status_check,
  add constraint orders_payment_status_check
    check (payment_status in ('pending', 'awaiting', 'paid', 'refunded', 'failed')),
  drop constraint if exists orders_delivery_status_check,
  add constraint orders_delivery_status_check
    check (
      delivery_status in (
        'not_scheduled',
        'scheduled',
        'courier_assigned',
        'in_transit',
        'delivered',
        'cancelled'
      )
    ),
  drop constraint if exists orders_payment_method_check,
  add constraint orders_payment_method_check
    check (
      payment_method in (
        'on_confirmation',
        'cash',
        'card_to_courier',
        'online'
      )
    );

alter table public.delivery_zones
  add column if not exists description text not null default '',
  add column if not exists minimum_order_kopecks bigint not null default 0,
  add column if not exists urgent_surcharge_kopecks bigint not null default 0,
  add column if not exists delivery_intervals jsonb not null
    default '["10:00–13:00","13:00–16:00","16:00–19:00","19:00–22:00"]'::jsonb;

alter table public.delivery_zones
  drop constraint if exists delivery_zones_minimum_order_check,
  add constraint delivery_zones_minimum_order_check
    check (minimum_order_kopecks >= 0),
  drop constraint if exists delivery_zones_urgent_surcharge_check,
  add constraint delivery_zones_urgent_surcharge_check
    check (urgent_surcharge_kopecks >= 0),
  drop constraint if exists delivery_zones_intervals_array_check,
  add constraint delivery_zones_intervals_array_check
    check (jsonb_typeof(delivery_intervals) = 'array');

alter table public.promo_codes
  add column if not exists description text not null default '',
  add column if not exists per_customer_limit integer;

alter table public.promo_codes
  drop constraint if exists promo_codes_per_customer_limit_check,
  add constraint promo_codes_per_customer_limit_check
    check (per_customer_limit is null or per_customer_limit > 0);

create table if not exists public.order_status_history (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (
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
  comment text not null default '',
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_log (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at desc);
create index if not exists order_status_history_status_created_idx
  on public.order_status_history (status, created_at desc);
create index if not exists admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id, created_at desc);
create index if not exists orders_payment_status_created_idx
  on public.orders (payment_status, created_at desc);
create index if not exists orders_delivery_status_created_idx
  on public.orders (delivery_status, created_at desc);

drop trigger if exists set_order_status_history_updated_at
  on public.order_status_history;
create trigger set_order_status_history_updated_at
before update on public.order_status_history
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_audit_log_updated_at
  on public.admin_audit_log;
create trigger set_admin_audit_log_updated_at
before update on public.admin_audit_log
for each row execute function public.set_updated_at();

create or replace function public.is_store_owner()
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
      and role = 'admin'
  );
$$;

revoke all on function public.is_store_owner() from public;
grant execute on function public.is_store_owner() to authenticated;

-- Менеджер не может выдать себе роль владельца или изменить чужой профиль.
drop policy if exists "active_admin_manage_admin_profiles"
  on public.admin_profiles;
create policy "store_owner_manage_admin_profiles"
on public.admin_profiles for all
to authenticated
using ((select public.is_store_owner()))
with check ((select public.is_store_owner()));

alter table public.order_status_history enable row level security;
alter table public.admin_audit_log enable row level security;

grant select, insert, update, delete
  on public.order_status_history, public.admin_audit_log
  to authenticated;

create policy "active_admin_manage_order_status_history"
on public.order_status_history for all
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

create policy "active_admin_manage_audit_log"
on public.admin_audit_log for all
to authenticated
using ((select public.is_active_admin()))
with check (
  (select public.is_active_admin())
  and actor_id = (select auth.uid())
);

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (
      order_id,
      status,
      comment,
      changed_by
    )
    values (
      new.id,
      new.status,
      new.manager_comment,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

revoke all on function public.record_order_status_change() from public;

drop trigger if exists record_order_status_change on public.orders;
create trigger record_order_status_change
after update of status on public.orders
for each row execute function public.record_order_status_change();

commit;
