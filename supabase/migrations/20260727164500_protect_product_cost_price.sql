-- Себестоимость не должна быть доступна публичному API даже у опубликованного товара.
revoke select on public.products from anon;

grant select (
  id,
  name,
  slug,
  sku,
  product_type,
  short_description,
  full_description,
  regular_price_kopecks,
  sale_price_kopecks,
  primary_category_id,
  stock_quantity,
  availability_status,
  is_made_to_order,
  is_bestseller,
  is_new,
  is_recommended,
  sort_order,
  attributes,
  seo_title,
  seo_description,
  publication_status,
  created_at,
  updated_at
) on public.products to anon;
