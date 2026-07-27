# Воздушная Москва

Интернет-магазин воздушных шаров для Москвы и Московской области на Next.js,
TypeScript, Tailwind CSS и Supabase.

Пошаговая инструкция для владельца магазина находится в
[`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md).

Каталог загружается из PostgreSQL в Supabase. Авторизация административной
панели работает через Supabase Auth, а фотографии загружаются в Supabase
Storage. Если база временно недоступна, публичная часть не падает: посетитель
увидит резервный тестовый каталог и понятное предупреждение.

## Что подключено

- 8 категорий и 20 тестовых товаров в `supabase/seed.sql`;
- категории, подкатегории, товары, варианты, характеристики и изображения;
- покупатели, заказы, зоны доставки, промокоды, настройки и состав композиций;
- внешние ключи, проверки, индексы и автоматическое обновление `updated_at`;
- RLS: гость читает только опубликованный каталог;
- себестоимость, заказы и служебные таблицы недоступны публичному API;
- изменения разрешены только активному администратору из `admin_profiles`;
- публичный бакет `catalog-images`, запись в него только для администратора;
- SSR-сессия администратора в cookie;
- состояния загрузки, пустого каталога и сетевой ошибки.

## Требования

- Node.js 22.13 или новее;
- npm;
- проект Supabase.

## Локальный запуск

1. Установите зависимости:

   ```bash
   npm install
   ```

2. Скопируйте безопасный пример настроек:

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   macOS или Linux:

   ```bash
   cp .env.example .env.local
   ```

3. В `.env.local` укажите URL проекта и publishable key из Supabase:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Publishable key предназначен для браузера и защищается RLS. Secret key,
   service role key, пароль базы и access token нельзя добавлять в Git.

4. Запустите сервер:

   ```bash
   npm run dev
   ```

5. Откройте [http://localhost:3000](http://localhost:3000).

Точная команда последующих запусков:

```bash
npm run dev
```

## Установка базы Supabase

Файлы находятся в папке `supabase/`:

- `migrations/20260727133000_initial_store_schema.sql` — основная схема, RLS и
  Storage;
- `migrations/20260727164500_protect_product_cost_price.sql` — отдельная защита
  себестоимости;
- `migrations/20260727183000_secure_admin_panel.sql` — заказы, история
  статусов, аудит, доставка и усиление прав административных ролей;
- `seed.sql` — воспроизводимые тестовые данные;
- `config.toml` — конфигурация Supabase CLI.

Через Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db push --include-seed
```

Тестовые данные можно заново сгенерировать из текущего
`data/mock-catalog.json`:

```bash
node scripts/generate-supabase-seed.mjs
```

## Первый администратор

1. В Supabase откройте **Authentication → Users** и создайте пользователя с
   электронной почтой и паролем.
2. Скопируйте UUID созданного пользователя.
3. Один раз выполните в Supabase SQL Editor:

   ```sql
   insert into public.admin_profiles (user_id, display_name, role)
   values ('UUID_ПОЛЬЗОВАТЕЛЯ', 'Администратор', 'admin');
   ```

4. Откройте `/admin/login` и войдите этими данными.

Самостоятельно назначить себе роль через публичный API невозможно: таблица
`admin_profiles` защищена RLS.

## Доступные страницы

| Страница | Адрес |
| --- | --- |
| Главная | `/` |
| Каталог | `/catalog` |
| Категория | `/catalog/[slug]` |
| Товар | `/product/[slug]` |
| Корзина | `/cart` |
| Оформление | `/checkout` |
| Доставка и оплата | `/delivery` |
| Контакты | `/contacts` |
| Вход администратора | `/admin/login` |
| Административная панель | `/admin` |
| Категории | `/admin/categories` |
| Товары | `/admin/products` |
| Заказы | `/admin/orders` |
| Доставка | `/admin/delivery` |
| Промокоды | `/admin/promos` |
| Настройки сайта | `/admin/settings` |

## Проверка проекта

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Основная структура

```text
app/                         страницы Next.js и общие layout
components/                  компоненты магазина
features/catalog/            получение и преобразование данных Supabase
features/admin/              авторизация, формы и загрузка изображений
features/cart/               состояние корзины
features/checkout/           форма оформления
lib/supabase/                browser/server/SSR-клиенты
supabase/migrations/         версионируемая SQL-схема
supabase/seed.sql            тестовые записи
data/mock-catalog.json       резервный каталог при аварии базы
tests/                       автоматические проверки страниц
```

## Важные ограничения текущего этапа

- форма оформления пока демонстрационная и не создаёт реальный заказ;
- автоматическая оплата и расчёт доставки ещё не подключены;
- тестовые картинки в бакете не загружаются автоматически, интерфейс сохраняет
  локальные визуальные заглушки до загрузки настоящих фотографий администратором;
- удаление неиспользуемых файлов Storage будет добавлено вместе с журналом
  очистки загрузок.
