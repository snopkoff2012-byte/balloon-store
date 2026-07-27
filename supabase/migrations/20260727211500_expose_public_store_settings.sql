-- The storefront may only read values that are intentionally public. All
-- administrative settings remain protected by the existing admin-only policy.
grant select on public.site_settings to anon;

drop policy if exists "public_read_storefront_settings" on public.site_settings;
create policy "public_read_storefront_settings"
on public.site_settings for select
to anon
using (
  key in (
    'store.contacts',
    'store.working_hours',
    'store.checkout',
    'home.hero'
  )
);
