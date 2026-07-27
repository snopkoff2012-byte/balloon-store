import "server-only";

import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { mockCatalogSeed } from "@/data/catalog-seed";
import { getOptionalPublicEnvironment } from "@/lib/environment";
import { withSupabaseRequestTimeout } from "@/lib/supabase/request-timeout";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CatalogSnapshot,
  ProductAttribute,
  ProductOption,
  ProductVariant,
} from "./types";
import type { CatalogLoadResult } from "./repository";

const categoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string(),
  full_description: z.string(),
  image_path: z.string(),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number(),
  publication_status: z.enum(["draft", "published", "hidden"]),
  seo_title: z.string(),
  seo_description: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const productRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  short_description: z.string(),
  full_description: z.string(),
  regular_price_kopecks: z.number(),
  sale_price_kopecks: z.number().nullable(),
  cost_price_kopecks: z.number().nullable().optional(),
  primary_category_id: z.string().uuid(),
  stock_quantity: z.number().nullable(),
  availability_status: z.enum([
    "in_stock",
    "limited",
    "out_of_stock",
    "preorder",
  ]),
  is_made_to_order: z.boolean(),
  is_bestseller: z.boolean(),
  is_new: z.boolean(),
  is_recommended: z.boolean(),
  sort_order: z.number(),
  attributes: z.unknown(),
  seo_title: z.string(),
  seo_description: z.string(),
  publication_status: z.enum(["draft", "published", "hidden"]),
  created_at: z.string(),
  updated_at: z.string(),
});

const imageRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  storage_path: z.string(),
  alt_text: z.string(),
  sort_order: z.number(),
  is_primary: z.boolean(),
});

const productCategoryRowSchema = z.object({
  product_id: z.string().uuid(),
  category_id: z.string().uuid(),
  is_primary: z.boolean(),
  sort_order: z.number(),
});

const optionRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  option_type: z.enum(["select", "multiselect", "text", "number", "boolean"]),
  is_required: z.boolean(),
  sort_order: z.number(),
});

const optionValueRowSchema = z.object({
  id: z.string().uuid(),
  option_id: z.string().uuid(),
  label: z.string(),
  value: z.string(),
  price_modifier_kopecks: z.number(),
  sort_order: z.number(),
});

const variantRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  sku: z.string(),
  option_value_ids: z.array(z.string().uuid()),
  price_modifier_kopecks: z.number(),
  stock_quantity: z.number().nullable(),
  availability_status: z.enum([
    "in_stock",
    "limited",
    "out_of_stock",
    "preorder",
  ]),
  is_active: z.boolean(),
});

const attributeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.enum(["text", "number", "boolean", "color", "multiselect"]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
  unit: z.string().nullable(),
  filterable: z.boolean(),
  sortOrder: z.number(),
});

const publicCatalogRpcSchema = z.object({
  categories: z.array(categoryRowSchema),
  products: z.array(productRowSchema),
  images: z.array(imageRowSchema),
  product_categories: z.array(productCategoryRowSchema),
  options: z.array(optionRowSchema),
  option_values: z.array(optionValueRowSchema),
  variants: z.array(variantRowSchema),
});

type CatalogLoadOptions = {
  includeUnpublished: boolean;
};

async function loadCatalog(
  loadOptions: CatalogLoadOptions,
): Promise<CatalogLoadResult> {
  const environment = getOptionalPublicEnvironment();
  if (!environment) {
    return {
      snapshot: mockCatalogSeed,
      source: "fallback",
      error:
        "Supabase пока не настроен. Показаны резервные тестовые данные.",
    };
  }

  // Vinext probes layouts outside an actual request in development. External
  // fetches started during that probe never settle, so hydrate from the local
  // snapshot immediately and let the browser refresh it from Supabase.
  if (process.env.NODE_ENV === "development") {
    return {
      snapshot: mockCatalogSeed,
      source: "fallback",
      error: null,
    };
  }

  try {
    const supabase = loadOptions.includeUnpublished
      ? await createServerSupabaseClient()
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
    let catalogRows: z.infer<typeof publicCatalogRpcSchema>;

    if (!loadOptions.includeUnpublished) {
      catalogRows = await withSupabaseRequestTimeout((signal) =>
        loadPublicCatalogRows(supabase, signal),
      );
    } else {
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
            .select(
              "id,name,slug,sku,short_description,full_description,regular_price_kopecks,sale_price_kopecks,cost_price_kopecks,primary_category_id,stock_quantity,availability_status,is_made_to_order,is_bestseller,is_new,is_recommended,sort_order,attributes,seo_title,seo_description,publication_status,created_at,updated_at",
            )
            .order("sort_order")
            .abortSignal(signal),
          supabase
            .from("product_images")
            .select(
              "id,product_id,storage_path,alt_text,sort_order,is_primary",
            )
            .order("sort_order")
            .abortSignal(signal),
          supabase
            .from("product_categories")
            .select("product_id,category_id,is_primary,sort_order")
            .order("sort_order")
            .abortSignal(signal),
          supabase
            .from("product_options")
            .select(
              "id,product_id,code,name,option_type,is_required,sort_order",
            )
            .order("sort_order")
            .abortSignal(signal),
          supabase
            .from("product_option_values")
            .select(
              "id,option_id,label,value,price_modifier_kopecks,sort_order",
            )
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
      catalogRows = publicCatalogRpcSchema.parse({
        categories: results[0].data,
        products: results[1].data,
        images: results[2].data,
        product_categories: results[3].data,
        options: results[4].data,
        option_values: results[5].data,
        variants: results[6].data,
      });
    }

    const categories = catalogRows.categories;
    const productRows = catalogRows.products;
    const images = catalogRows.images;
    const productCategories = catalogRows.product_categories;
    const options = catalogRows.options;
    const optionValues = catalogRows.option_values;
    const variants = catalogRows.variants;

    const snapshot: CatalogSnapshot = {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        shortDescription: category.short_description,
        fullDescription: category.full_description,
        image: publicStorageUrl(supabase, category.image_path),
        parentId: category.parent_id,
        sortOrder: category.sort_order,
        publicationStatus: category.publication_status,
        seoTitle: category.seo_title,
        seoDescription: category.seo_description,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      })),
      products: productRows.map((product) => {
        const productOptions: ProductOption[] = options
          .filter((option) => option.product_id === product.id)
          .map((option) => ({
            id: option.id,
            code: option.code,
            name: option.name,
            type: option.option_type,
            required: option.is_required,
            sortOrder: option.sort_order,
            values: optionValues
              .filter((value) => value.option_id === option.id)
              .map((value) => ({
                id: value.id,
                label: value.label,
                value: value.value,
                priceModifierKopecks: value.price_modifier_kopecks,
                sortOrder: value.sort_order,
              })),
          }));
        const productVariants: ProductVariant[] = variants
          .filter((variant) => variant.product_id === product.id)
          .map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            optionValueIds: variant.option_value_ids,
            priceModifierKopecks: variant.price_modifier_kopecks,
            stockQuantity: variant.stock_quantity,
            availabilityStatus: variant.availability_status,
            active: variant.is_active,
          }));
        const parsedAttributes = z
          .array(attributeSchema)
          .safeParse(product.attributes);
        const attributes: ProductAttribute[] = parsedAttributes.success
          ? parsedAttributes.data
          : [];

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.short_description,
          fullDescription: product.full_description,
          regularPriceKopecks: product.regular_price_kopecks,
          salePriceKopecks: product.sale_price_kopecks,
          costPriceKopecks: loadOptions.includeUnpublished
            ? (product.cost_price_kopecks ?? null)
            : null,
          images: images
            .filter((image) => image.product_id === product.id)
            .map((image) => ({
              id: image.id,
              src: publicStorageUrl(supabase, image.storage_path),
              alt: image.alt_text,
              sortOrder: image.sort_order,
              isPrimary: image.is_primary,
            })),
          primaryCategoryId: product.primary_category_id,
          categoryIds: productCategories
            .filter((relation) => relation.product_id === product.id)
            .map((relation) => relation.category_id),
          stockQuantity: product.stock_quantity,
          availabilityStatus: product.availability_status,
          isMadeToOrder: product.is_made_to_order,
          isBestseller: product.is_bestseller,
          isNew: product.is_new,
          isRecommended: product.is_recommended,
          sortOrder: product.sort_order,
          options: productOptions,
          variants: productVariants,
          attributes,
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          publicationStatus: product.publication_status,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        };
      }),
    };

    return { snapshot, source: "supabase", error: null };
  } catch (error) {
    console.warn("Catalog loading failed, using fallback data:", error);
    return {
      snapshot: mockCatalogSeed,
      source: "fallback",
      error:
        "Не удалось связаться с базой. Магазин продолжает работать на резервных данных.",
    };
  }
}

async function loadPublicCatalogRows(
  supabase: SupabaseClient,
  signal: AbortSignal,
) {
  const [
    categoryResult,
    productResult,
    imageResult,
    productCategoryResult,
    optionResult,
    optionValueResult,
    variantResult,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id,name,slug,short_description,full_description,image_path,parent_id,sort_order,publication_status,seo_title,seo_description,created_at,updated_at",
      )
      .eq("publication_status", "published")
      .order("sort_order")
      .abortSignal(signal),
    supabase
      .from("products")
      .select(
        "id,name,slug,sku,short_description,full_description,regular_price_kopecks,sale_price_kopecks,primary_category_id,stock_quantity,availability_status,is_made_to_order,is_bestseller,is_new,is_recommended,sort_order,attributes,seo_title,seo_description,publication_status,created_at,updated_at",
      )
      .eq("publication_status", "published")
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
      .eq("is_active", true)
      .abortSignal(signal),
  ] as const);
  const databaseError = [
    categoryResult,
    productResult,
    imageResult,
    productCategoryResult,
    optionResult,
    optionValueResult,
    variantResult,
  ]
    .map((result) => result.error)
    .find(Boolean);
  if (databaseError) throw new Error(databaseError.message);

  return publicCatalogRpcSchema.parse({
    categories: categoryResult.data,
    products: productResult.data,
    images: imageResult.data,
    product_categories: productCategoryResult.data,
    options: optionResult.data,
    option_values: optionValueResult.data,
    variants: variantResult.data,
  });
}

export const loadPublicCatalog = cache(() =>
  loadCatalog({ includeUnpublished: false }),
);

export const loadAdminCatalog = cache(() =>
  loadCatalog({ includeUnpublished: true }),
);

function publicStorageUrl(
  supabase: SupabaseClient,
  storagePath: string,
) {
  if (!storagePath) return "";
  if (storagePath.startsWith("/") || storagePath.startsWith("http")) {
    return storagePath;
  }
  return supabase.storage.from("catalog-images").getPublicUrl(storagePath).data
    .publicUrl;
}
