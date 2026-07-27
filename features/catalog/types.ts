export type PublicationStatus = "draft" | "published" | "hidden";

export type AvailabilityStatus =
  | "in_stock"
  | "limited"
  | "out_of_stock"
  | "preorder";

export type ProductOptionType =
  | "select"
  | "multiselect"
  | "text"
  | "number"
  | "boolean";

export type AttributeValue = string | number | boolean | string[];

export type Category = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  parentId: string | null;
  sortOrder: number;
  publicationStatus: PublicationStatus;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  id: string;
  src: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductOptionValue = {
  id: string;
  label: string;
  value: string;
  priceModifierKopecks: number;
  sortOrder: number;
};

export type ProductOption = {
  id: string;
  code: string;
  name: string;
  type: ProductOptionType;
  required: boolean;
  sortOrder: number;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  optionValueIds: string[];
  priceModifierKopecks: number;
  stockQuantity: number | null;
  availabilityStatus: AvailabilityStatus;
  active: boolean;
};

export type ProductAttribute = {
  id: string;
  code: string;
  name: string;
  type: "text" | "number" | "boolean" | "color" | "multiselect";
  value: AttributeValue;
  unit: string | null;
  filterable: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  regularPriceKopecks: number;
  salePriceKopecks: number | null;
  costPriceKopecks: number | null;
  images: ProductImage[];
  primaryCategoryId: string;
  categoryIds: string[];
  stockQuantity: number | null;
  availabilityStatus: AvailabilityStatus;
  isMadeToOrder: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isRecommended: boolean;
  sortOrder: number;
  options: ProductOption[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  seoTitle: string;
  seoDescription: string;
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
};

export function getProductPrice(product: Product) {
  return product.salePriceKopecks ?? product.regularPriceKopecks;
}

export function getPrimaryImage(product: Product) {
  return (
    product.images.find((image) => image.isPrimary) ??
    [...product.images].sort((first, second) => first.sortOrder - second.sortOrder)[0]
  );
}

export function getProductAttribute(
  product: Product,
  code: string,
): ProductAttribute | undefined {
  return product.attributes.find((attribute) => attribute.code === code);
}
