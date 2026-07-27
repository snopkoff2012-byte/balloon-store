import { z } from "zod";

export const publicationStatusSchema = z.enum([
  "draft",
  "published",
  "hidden",
]);

export const availabilityStatusSchema = z.enum([
  "in_stock",
  "limited",
  "out_of_stock",
  "preorder",
]);

const productImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  alt: z.string(),
  sortOrder: z.number().int(),
  isPrimary: z.boolean(),
});

const productOptionValueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  priceModifierKopecks: z.number().int(),
  sortOrder: z.number().int(),
});

const productOptionSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["select", "multiselect", "text", "number", "boolean"]),
  required: z.boolean(),
  sortOrder: z.number().int(),
  values: z.array(productOptionValueSchema),
});

const productVariantSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  optionValueIds: z.array(z.string()),
  priceModifierKopecks: z.number().int(),
  stockQuantity: z.number().int().nonnegative().nullable(),
  availabilityStatus: availabilityStatusSchema,
  active: z.boolean(),
});

const productAttributeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["text", "number", "boolean", "color", "multiselect"]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
  unit: z.string().nullable(),
  filterable: z.boolean(),
  sortOrder: z.number().int(),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string(),
  fullDescription: z.string(),
  image: z.string(),
  parentId: z.string().nullable(),
  sortOrder: z.number().int(),
  publicationStatus: publicationStatusSchema,
  seoTitle: z.string(),
  seoDescription: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().min(1),
  shortDescription: z.string(),
  fullDescription: z.string(),
  regularPriceKopecks: z.number().int().nonnegative(),
  salePriceKopecks: z.number().int().nonnegative().nullable(),
  costPriceKopecks: z.number().int().nonnegative().nullable(),
  images: z.array(productImageSchema),
  primaryCategoryId: z.string().min(1),
  categoryIds: z.array(z.string()).min(1),
  stockQuantity: z.number().int().nonnegative().nullable(),
  availabilityStatus: availabilityStatusSchema,
  isMadeToOrder: z.boolean(),
  isBestseller: z.boolean(),
  isNew: z.boolean(),
  isRecommended: z.boolean(),
  sortOrder: z.number().int(),
  options: z.array(productOptionSchema),
  variants: z.array(productVariantSchema),
  attributes: z.array(productAttributeSchema),
  seoTitle: z.string(),
  seoDescription: z.string(),
  publicationStatus: publicationStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const catalogSnapshotSchema = z.object({
  categories: z.array(categorySchema),
  products: z.array(productSchema),
});

export const categoryFormSchema = categorySchema
  .pick({
    name: true,
    slug: true,
    shortDescription: true,
    fullDescription: true,
    image: true,
    parentId: true,
    sortOrder: true,
    publicationStatus: true,
    seoTitle: true,
    seoDescription: true,
  })
  .extend({
    parentId: z.string(),
    sortOrder: z.coerce.number().int().min(0),
  });

export const productFormSchema = z.object({
  name: z.string().min(2, "Укажите название"),
  slug: z
    .string()
    .min(2, "Укажите slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы"),
  sku: z.string().min(1, "Укажите артикул"),
  shortDescription: z.string().min(5, "Добавьте краткое описание"),
  fullDescription: z.string().min(10, "Добавьте полное описание"),
  regularPriceRub: z.coerce.number().min(0),
  salePriceRub: z.union([z.literal(""), z.coerce.number().min(0)]),
  costPriceRub: z.union([z.literal(""), z.coerce.number().min(0)]),
  primaryCategoryId: z.string().min(1, "Выберите основную категорию"),
  categoryIds: z.array(z.string()).min(1, "Выберите хотя бы одну категорию"),
  stockQuantity: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  availabilityStatus: availabilityStatusSchema,
  isMadeToOrder: z.boolean(),
  isBestseller: z.boolean(),
  isNew: z.boolean(),
  isRecommended: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  seoTitle: z.string(),
  seoDescription: z.string(),
  publicationStatus: publicationStatusSchema,
});
