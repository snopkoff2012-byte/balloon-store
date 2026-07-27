"use client";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnvironment } from "@/lib/environment";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { withSupabaseRequestTimeout } from "@/lib/supabase/request-timeout";
import type {
  CatalogSnapshot,
  Category,
  Product,
  ProductAttribute,
  ProductOption,
  ProductVariant,
} from "./types";

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveCategoryToSupabase(category: Category) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("categories").upsert({
    id: category.id,
    name: category.name,
    slug: category.slug,
    short_description: category.shortDescription,
    full_description: category.fullDescription,
    image_path: storagePathFromUrl(category.image),
    parent_id: category.parentId,
    sort_order: category.sortOrder,
    publication_status: category.publicationStatus,
    seo_title: category.seoTitle,
    seo_description: category.seoDescription,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  });
  throwIfError(error);
  return category;
}

export async function deleteCategoryFromSupabase(id: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  throwIfError(error);
}

export async function saveProductToSupabase(product: Product) {
  const supabase = createBrowserSupabaseClient();
  const { error: productError } = await supabase.from("products").upsert({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    product_type: "simple",
    short_description: product.shortDescription,
    full_description: product.fullDescription,
    regular_price_kopecks: product.regularPriceKopecks,
    sale_price_kopecks: product.salePriceKopecks,
    cost_price_kopecks: product.costPriceKopecks,
    primary_category_id: product.primaryCategoryId,
    stock_quantity: product.stockQuantity,
    availability_status: product.availabilityStatus,
    is_made_to_order: product.isMadeToOrder,
    is_bestseller: product.isBestseller,
    is_new: product.isNew,
    is_recommended: product.isRecommended,
    sort_order: product.sortOrder,
    attributes: product.attributes,
    seo_title: product.seoTitle,
    seo_description: product.seoDescription,
    publication_status: product.publicationStatus,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  });
  throwIfError(productError);

  const cleanupResults = await Promise.all([
    supabase.from("product_categories").delete().eq("product_id", product.id),
    supabase.from("product_images").delete().eq("product_id", product.id),
    supabase.from("product_options").delete().eq("product_id", product.id),
    supabase.from("product_variants").delete().eq("product_id", product.id),
  ]);
  cleanupResults.forEach((result) => throwIfError(result.error));

  if (product.categoryIds.length > 0) {
    const { error } = await supabase.from("product_categories").insert(
      product.categoryIds.map((categoryId, index) => ({
        product_id: product.id,
        category_id: categoryId,
        is_primary: categoryId === product.primaryCategoryId,
        sort_order: index,
      })),
    );
    throwIfError(error);
  }

  if (product.images.length > 0) {
    const { error } = await supabase.from("product_images").insert(
      product.images.map((image) => ({
        id: image.id,
        product_id: product.id,
        storage_path: storagePathFromUrl(image.src),
        alt_text: image.alt,
        sort_order: image.sortOrder,
        is_primary: image.isPrimary,
      })),
    );
    throwIfError(error);
  }

  for (const option of product.options) {
    const { error: optionError } = await supabase
      .from("product_options")
      .insert({
        id: option.id,
        product_id: product.id,
        code: option.code,
        name: option.name,
        option_type: option.type,
        is_required: option.required,
        sort_order: option.sortOrder,
      });
    throwIfError(optionError);

    if (option.values.length > 0) {
      const { error: valuesError } = await supabase
        .from("product_option_values")
        .insert(
          option.values.map((value) => ({
            id: value.id,
            option_id: option.id,
            label: value.label,
            value: value.value,
            price_modifier_kopecks: value.priceModifierKopecks,
            sort_order: value.sortOrder,
          })),
        );
      throwIfError(valuesError);
    }
  }

  if (product.variants.length > 0) {
    const { error } = await supabase.from("product_variants").insert(
      product.variants.map((variant) => ({
        id: variant.id,
        product_id: product.id,
        sku: variant.sku,
        option_value_ids: variant.optionValueIds,
        price_modifier_kopecks: variant.priceModifierKopecks,
        stock_quantity: variant.stockQuantity,
        availability_status: variant.availabilityStatus,
        is_active: variant.active,
      })),
    );
    throwIfError(error);
  }

  return product;
}

export async function deleteProductFromSupabase(id: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  throwIfError(error);
}

export async function loadCatalogFromSupabaseBrowser({
  admin,
}: {
  admin: boolean;
}): Promise<CatalogSnapshot> {
  const environment = getPublicEnvironment();
  const supabase = admin
    ? createBrowserSupabaseClient()
    : createClient(
        environment.NEXT_PUBLIC_SUPABASE_URL,
        environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
      );
  const productColumns: string = admin
    ? "id,name,slug,sku,short_description,full_description,regular_price_kopecks,sale_price_kopecks,cost_price_kopecks,primary_category_id,stock_quantity,availability_status,is_made_to_order,is_bestseller,is_new,is_recommended,sort_order,attributes,seo_title,seo_description,publication_status,created_at,updated_at"
    : "id,name,slug,sku,short_description,full_description,regular_price_kopecks,sale_price_kopecks,primary_category_id,stock_quantity,availability_status,is_made_to_order,is_bestseller,is_new,is_recommended,sort_order,attributes,seo_title,seo_description,publication_status,created_at,updated_at";
  const results = await withSupabaseRequestTimeout((signal) =>
    Promise.all([
      supabase
        .from("categories")
        .select(
          "id,name,slug,short_description,full_description,image_path,parent_id,sort_order,publication_status,seo_title,seo_description,created_at,updated_at",
        )
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("products")
        .select(productColumns)
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("product_images")
        .select("id,product_id,storage_path,alt_text,sort_order,is_primary")
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("product_categories")
        .select("product_id,category_id,is_primary,sort_order")
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("product_options")
        .select("id,product_id,code,name,option_type,is_required,sort_order")
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("product_option_values")
        .select("id,option_id,label,value,price_modifier_kopecks,sort_order")
        .order("sort_order")
        .abortSignal(signal),
      supabase
        .from("product_variants")
        .select(
          "id,product_id,sku,option_value_ids,price_modifier_kopecks,stock_quantity,availability_status,is_active",
        )
        .abortSignal(signal),
    ] as const),
  );
  const databaseError = results.map((result) => result.error).find(Boolean);
  if (databaseError) throw new Error(databaseError.message);

  const [
    categoryRows,
    productRows,
    imageRows,
    relationRows,
    optionRows,
    valueRows,
    variantRows,
  ] = results.map((result) => result.data ?? []) as Array<
    Array<Record<string, unknown>>
  >;
  const publicUrl = (path: string) =>
    path.startsWith("/") || path.startsWith("http")
      ? path
      : supabase.storage.from("catalog-images").getPublicUrl(path).data.publicUrl;

  return {
    categories: categoryRows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      shortDescription: String(row.short_description),
      fullDescription: String(row.full_description),
      image: publicUrl(String(row.image_path)),
      parentId: row.parent_id ? String(row.parent_id) : null,
      sortOrder: Number(row.sort_order),
      publicationStatus: row.publication_status as Category["publicationStatus"],
      seoTitle: String(row.seo_title),
      seoDescription: String(row.seo_description),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    products: productRows.map((row) => {
      const productOptions: ProductOption[] = optionRows
        .filter((option) => option.product_id === row.id)
        .map((option) => ({
          id: String(option.id),
          code: String(option.code),
          name: String(option.name),
          type: option.option_type as ProductOption["type"],
          required: Boolean(option.is_required),
          sortOrder: Number(option.sort_order),
          values: valueRows
            .filter((value) => value.option_id === option.id)
            .map((value) => ({
              id: String(value.id),
              label: String(value.label),
              value: String(value.value),
              priceModifierKopecks: Number(value.price_modifier_kopecks),
              sortOrder: Number(value.sort_order),
            })),
        }));
      const variants: ProductVariant[] = variantRows
        .filter((variant) => variant.product_id === row.id)
        .map((variant) => ({
          id: String(variant.id),
          sku: String(variant.sku),
          optionValueIds: Array.isArray(variant.option_value_ids)
            ? variant.option_value_ids.map(String)
            : [],
          priceModifierKopecks: Number(variant.price_modifier_kopecks),
          stockQuantity:
            variant.stock_quantity === null
              ? null
              : Number(variant.stock_quantity),
          availabilityStatus:
            variant.availability_status as ProductVariant["availabilityStatus"],
          active: Boolean(variant.is_active),
        }));
      const attributes = Array.isArray(row.attributes)
        ? (row.attributes as ProductAttribute[])
        : [];

      return {
        id: String(row.id),
        name: String(row.name),
        slug: String(row.slug),
        sku: String(row.sku),
        shortDescription: String(row.short_description),
        fullDescription: String(row.full_description),
        regularPriceKopecks: Number(row.regular_price_kopecks),
        salePriceKopecks:
          row.sale_price_kopecks === null
            ? null
            : Number(row.sale_price_kopecks),
        costPriceKopecks:
          admin && row.cost_price_kopecks !== null
            ? Number(row.cost_price_kopecks)
            : null,
        images: imageRows
          .filter((image) => image.product_id === row.id)
          .map((image) => ({
            id: String(image.id),
            src: publicUrl(String(image.storage_path)),
            alt: String(image.alt_text),
            sortOrder: Number(image.sort_order),
            isPrimary: Boolean(image.is_primary),
          })),
        primaryCategoryId: String(row.primary_category_id),
        categoryIds: relationRows
          .filter((relation) => relation.product_id === row.id)
          .map((relation) => String(relation.category_id)),
        stockQuantity:
          row.stock_quantity === null ? null : Number(row.stock_quantity),
        availabilityStatus:
          row.availability_status as Product["availabilityStatus"],
        isMadeToOrder: Boolean(row.is_made_to_order),
        isBestseller: Boolean(row.is_bestseller),
        isNew: Boolean(row.is_new),
        isRecommended: Boolean(row.is_recommended),
        sortOrder: Number(row.sort_order),
        options: productOptions,
        variants,
        attributes,
        seoTitle: String(row.seo_title),
        seoDescription: String(row.seo_description),
        publicationStatus:
          row.publication_status as Product["publicationStatus"],
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    }),
  };
}

function storagePathFromUrl(value: string) {
  const marker = "/storage/v1/object/public/catalog-images/";
  const markerIndex = value.indexOf(marker);
  return markerIndex >= 0
    ? decodeURIComponent(value.slice(markerIndex + marker.length))
    : value;
}
