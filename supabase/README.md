# Supabase

Папка содержит воспроизводимую схему базы и тестовые данные.

## Файлы

- `migrations/20260727133000_initial_store_schema.sql` — таблицы, индексы,
  триггеры, RLS и Storage.
- `migrations/20260727164500_protect_product_cost_price.sql` — запрет публичного
  чтения себестоимости товара.
- `migrations/20260727183000_secure_admin_panel.sql` — заказы, история
  статусов, аудит, доставка и усиление прав административных ролей.
- `seed.sql` — 8 категорий, 20 товаров и вспомогательные тестовые записи.
- `config.toml` — локальная конфигурация Supabase CLI.

## Первый администратор

После создания пользователя в Supabase Auth владелец проекта один раз выполняет
в SQL Editor:

```sql
insert into public.admin_profiles (user_id, display_name, role)
values ('UUID_ПОЛЬЗОВАТЕЛЯ_ИЗ_AUTH_USERS', 'Администратор', 'admin');
```

Обычный пользователь не может добавить или повысить себе роль: таблица
`admin_profiles` защищена RLS.
