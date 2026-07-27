import rawCatalogSeed from "./mock-catalog.json";
import { catalogSnapshotSchema } from "@/features/catalog/schemas";
import type {
  AvailabilityStatus,
  CatalogSnapshot,
  Product,
  ProductOption,
  PublicationStatus,
} from "@/features/catalog/types";

type RawOption = {
  code: string;
  name: string;
  values: Array<{ label: string; value: string; priceModifierKopecks: number }>;
};

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  regularPriceKopecks: number;
  salePriceKopecks: number | null;
  costPriceKopecks: number | null;
  primaryCategoryId: string;
  categoryIds: string[];
  stockQuantity: number | null;
  availabilityStatus: AvailabilityStatus;
  isMadeToOrder: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isRecommended: boolean;
  sortOrder: number;
  colors: string[];
  sizes: string[];
  material: string;
  manufacturingTime: string;
  extraOptions: RawOption[];
  publicationStatus: PublicationStatus;
  createdAt: string;
};

const sizeModifiers: Record<string, number> = {
  Компактный: -50000,
  Стандартный: 0,
  Большой: 150000,
  XL: 280000,
};

function createOption(
  productId: string,
  code: string,
  name: string,
  values: Array<{
    label: string;
    value: string;
    priceModifierKopecks: number;
  }>,
  sortOrder: number,
): ProductOption {
  return {
    id: `${productId}-option-${code}`,
    code,
    name,
    type: "select",
    required: true,
    sortOrder,
    values: values.map((value, index) => ({
      id: `${productId}-${code}-${value.value}`,
      ...value,
      sortOrder: index,
    })),
  };
}

function expandProduct(rawProduct: RawProduct): Product {
  const options: ProductOption[] = [];

  if (rawProduct.colors.length > 0) {
    options.push(
      createOption(
        rawProduct.id,
        "color",
        "Цвет",
        rawProduct.colors.map((color) => ({
          label: color,
          value: color.toLowerCase().replaceAll(" ", "-"),
          priceModifierKopecks: color.includes("Хром") ? 30000 : 0,
        })),
        0,
      ),
    );
  }

  if (rawProduct.sizes.length > 0) {
    options.push(
      createOption(
        rawProduct.id,
        "size",
        "Размер композиции",
        rawProduct.sizes.map((size) => ({
          label: size,
          value: size.toLowerCase().replaceAll(" ", "-"),
          priceModifierKopecks: sizeModifiers[size] ?? 0,
        })),
        1,
      ),
    );
  }

  rawProduct.extraOptions.forEach((option, optionIndex) => {
    options.push(
      createOption(
        rawProduct.id,
        option.code,
        option.name,
        option.values,
        optionIndex + 2,
      ),
    );
  });

  const defaultOptionValueIds = options.flatMap((option) =>
    option.values[0] ? [option.values[0].id] : [],
  );

  return {
    id: rawProduct.id,
    name: rawProduct.name,
    slug: rawProduct.slug,
    sku: rawProduct.sku,
    shortDescription: rawProduct.shortDescription,
    fullDescription: rawProduct.fullDescription,
    regularPriceKopecks: rawProduct.regularPriceKopecks,
    salePriceKopecks: rawProduct.salePriceKopecks,
    costPriceKopecks: rawProduct.costPriceKopecks,
    images: [
      {
        id: `${rawProduct.id}-image-main`,
        src: "/og.png",
        alt: rawProduct.name,
        sortOrder: 0,
        isPrimary: true,
      },
      {
        id: `${rawProduct.id}-image-detail`,
        src: "/social-preview.png",
        alt: `${rawProduct.name}, дополнительный ракурс`,
        sortOrder: 1,
        isPrimary: false,
      },
    ],
    primaryCategoryId: rawProduct.primaryCategoryId,
    categoryIds: rawProduct.categoryIds,
    stockQuantity: rawProduct.stockQuantity,
    availabilityStatus: rawProduct.availabilityStatus,
    isMadeToOrder: rawProduct.isMadeToOrder,
    isBestseller: rawProduct.isBestseller,
    isNew: rawProduct.isNew,
    isRecommended: rawProduct.isRecommended,
    sortOrder: rawProduct.sortOrder,
    options,
    variants: [
      {
        id: `${rawProduct.id}-variant-default`,
        sku: rawProduct.sku,
        optionValueIds: defaultOptionValueIds,
        priceModifierKopecks: 0,
        stockQuantity: rawProduct.stockQuantity,
        availabilityStatus: rawProduct.availabilityStatus,
        active: true,
      },
    ],
    attributes: [
      {
        id: `${rawProduct.id}-attribute-material`,
        code: "material",
        name: "Материал",
        type: "text",
        value: rawProduct.material,
        unit: null,
        filterable: true,
        sortOrder: 0,
      },
      {
        id: `${rawProduct.id}-attribute-colors`,
        code: "colors",
        name: "Доступные цвета",
        type: "multiselect",
        value: rawProduct.colors,
        unit: null,
        filterable: true,
        sortOrder: 1,
      },
      {
        id: `${rawProduct.id}-attribute-sizes`,
        code: "sizes",
        name: "Размеры",
        type: "multiselect",
        value: rawProduct.sizes,
        unit: null,
        filterable: true,
        sortOrder: 2,
      },
      {
        id: `${rawProduct.id}-attribute-manufacturing`,
        code: "manufacturing_time",
        name: "Примерное время изготовления",
        type: "text",
        value: rawProduct.manufacturingTime,
        unit: null,
        filterable: false,
        sortOrder: 3,
      },
    ],
    seoTitle: `${rawProduct.name} — заказать с доставкой`,
    seoDescription: rawProduct.shortDescription,
    publicationStatus: rawProduct.publicationStatus,
    createdAt: rawProduct.createdAt,
    updatedAt: rawProduct.createdAt,
  };
}

const expandedCatalog = {
  categories: rawCatalogSeed.categories,
  products: (rawCatalogSeed.products as RawProduct[]).map(expandProduct),
};

export const mockCatalogSeed: CatalogSnapshot =
  catalogSnapshotSchema.parse(expandedCatalog);
