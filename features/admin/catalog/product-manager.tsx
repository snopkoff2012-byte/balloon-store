"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { productFormSchema } from "@/features/catalog/schemas";
import { useCatalogStore } from "@/features/catalog/store";
import type {
  Product,
  ProductAttribute,
  ProductImage,
  ProductOption,
  ProductOptionValue,
} from "@/features/catalog/types";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";

type ProductFormValues = z.input<typeof productFormSchema>;

type DraftAttribute = Omit<ProductAttribute, "value"> & { value: string };

const emptyForm: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  fullDescription: "",
  regularPriceRub: 0,
  salePriceRub: "",
  costPriceRub: "",
  primaryCategoryId: "",
  categoryIds: [],
  stockQuantity: 0,
  availabilityStatus: "in_stock",
  isMadeToOrder: false,
  isBestseller: false,
  isNew: false,
  isRecommended: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
  publicationStatus: "draft",
};

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

const defaultImages = (): ProductImage[] => [
  {
    id: createId("image"),
    src: "/og.png",
    alt: "Фотография товара",
    sortOrder: 0,
    isPrimary: true,
  },
];

function attributesToDraft(attributes: ProductAttribute[]): DraftAttribute[] {
  return attributes.map((attribute) => ({
    ...attribute,
    value: Array.isArray(attribute.value)
      ? attribute.value.join(", ")
      : String(attribute.value),
  }));
}

function draftToAttributes(attributes: DraftAttribute[]): ProductAttribute[] {
  return attributes.map((attribute) => {
    let value: ProductAttribute["value"] = attribute.value;
    if (attribute.type === "multiselect") {
      value = attribute.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (attribute.type === "number") {
      value = Number(attribute.value) || 0;
    } else if (attribute.type === "boolean") {
      value = attribute.value === "true";
    }
    return { ...attribute, value };
  });
}

export function ProductManager() {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const saveProduct = useCatalogStore((state) => state.saveProduct);
  const deleteProduct = useCatalogStore((state) => state.deleteProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [images, setImages] = useState<ProductImage[]>(defaultImages);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [attributes, setAttributes] = useState<DraftAttribute[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyForm,
  });

  const selectedCategoryIds =
    useWatch({ control, name: "categoryIds" }) ?? [];
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return [...products]
      .filter((product) =>
        normalized
          ? `${product.name} ${product.sku} ${product.slug}`
              .toLocaleLowerCase("ru")
              .includes(normalized)
          : true,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products, query]);

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setImages(defaultImages());
    setOptions([]);
    setAttributes([]);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    reset({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      regularPriceRub: product.regularPriceKopecks / 100,
      salePriceRub:
        product.salePriceKopecks === null
          ? ""
          : product.salePriceKopecks / 100,
      costPriceRub:
        product.costPriceKopecks === null
          ? ""
          : product.costPriceKopecks / 100,
      primaryCategoryId: product.primaryCategoryId,
      categoryIds: product.categoryIds,
      stockQuantity: product.stockQuantity ?? "",
      availabilityStatus: product.availabilityStatus,
      isMadeToOrder: product.isMadeToOrder,
      isBestseller: product.isBestseller,
      isNew: product.isNew,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      publicationStatus: product.publicationStatus,
    });
    setImages(product.images);
    setOptions(product.options);
    setAttributes(attributesToDraft(product.attributes));
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(values: ProductFormValues) {
    const parsed = productFormSchema.parse(values);
    if (
      products.some(
        (product) => product.slug === parsed.slug && product.id !== editingId,
      )
    ) {
      setNotice("Такой slug уже используется.");
      return;
    }
    if (
      products.some(
        (product) => product.sku === parsed.sku && product.id !== editingId,
      )
    ) {
      setNotice("Такой артикул уже используется.");
      return;
    }

    const categoryIds = Array.from(
      new Set([parsed.primaryCategoryId, ...parsed.categoryIds]),
    );
    const normalizedImages =
      images.length === 0
        ? defaultImages()
        : images.map((image, index) => ({
            ...image,
            sortOrder: index,
            isPrimary:
              images.some((item) => item.isPrimary)
                ? image.isPrimary
                : index === 0,
          }));
    const current = products.find((product) => product.id === editingId);
    const now = new Date().toISOString();
    const id = current?.id ?? createId("product");
    const stockQuantity =
      parsed.stockQuantity === "" ? null : parsed.stockQuantity;

    saveProduct({
      id,
      name: parsed.name,
      slug: parsed.slug,
      sku: parsed.sku,
      shortDescription: parsed.shortDescription,
      fullDescription: parsed.fullDescription,
      regularPriceKopecks: Math.round(parsed.regularPriceRub * 100),
      salePriceKopecks:
        parsed.salePriceRub === ""
          ? null
          : Math.round(parsed.salePriceRub * 100),
      costPriceKopecks:
        parsed.costPriceRub === ""
          ? null
          : Math.round(parsed.costPriceRub * 100),
      images: normalizedImages,
      primaryCategoryId: parsed.primaryCategoryId,
      categoryIds,
      stockQuantity,
      availabilityStatus: parsed.availabilityStatus,
      isMadeToOrder: parsed.isMadeToOrder,
      isBestseller: parsed.isBestseller,
      isNew: parsed.isNew,
      isRecommended: parsed.isRecommended,
      sortOrder: parsed.sortOrder,
      options,
      variants: [
        {
          id: current?.variants[0]?.id ?? `${id}-variant-default`,
          sku: parsed.sku,
          optionValueIds: options.flatMap((option) =>
            option.values[0] ? [option.values[0].id] : [],
          ),
          priceModifierKopecks: 0,
          stockQuantity,
          availabilityStatus: parsed.availabilityStatus,
          active: true,
        },
      ],
      attributes: draftToAttributes(attributes),
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      publicationStatus: parsed.publicationStatus,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
    setNotice(current ? "Товар обновлён." : "Товар добавлен.");
    setEditingId(null);
    reset(emptyForm);
    setImages(defaultImages());
    setOptions([]);
    setAttributes([]);
  }

  function toggleVisibility(product: Product) {
    saveProduct({
      ...product,
      publicationStatus:
        product.publicationStatus === "published" ? "hidden" : "published",
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDelete(product: Product) {
    if (
      window.confirm(
        `Удалить тестовый товар «${product.name}»? В реальной базе товары из заказов будут только архивироваться.`,
      )
    ) {
      deleteProduct(product.id);
    }
  }

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(480px,0.9fr)_minmax(520px,1.1fr)]">
      <section className="h-fit rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              Полная карточка
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              {editingId ? "Редактировать товар" : "Новый товар"}
            </h1>
          </div>
          {editingId ? (
            <button type="button" onClick={startCreate} className="admin-link">
              Отмена
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6">
          <AdminSection title="Основное">
            <AdminField label="Название" error={errors.name?.message}>
              <input {...register("name")} className="admin-input" />
            </AdminField>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Slug" error={errors.slug?.message}>
                <input {...register("slug")} className="admin-input" />
              </AdminField>
              <AdminField label="Артикул" error={errors.sku?.message}>
                <input {...register("sku")} className="admin-input" />
              </AdminField>
            </div>
            <AdminField label="Краткое описание" error={errors.shortDescription?.message}>
              <textarea {...register("shortDescription")} className="admin-input min-h-20" />
            </AdminField>
            <AdminField label="Полное описание" error={errors.fullDescription?.message}>
              <textarea {...register("fullDescription")} className="admin-input min-h-28" />
            </AdminField>
          </AdminSection>

          <AdminSection title="Цены и наличие">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminField label="Цена, ₽">
                <input type="number" min="0" step="1" {...register("regularPriceRub")} className="admin-input" />
              </AdminField>
              <AdminField label="Цена со скидкой, ₽">
                <input type="number" min="0" step="1" {...register("salePriceRub")} className="admin-input" />
              </AdminField>
              <AdminField label="Себестоимость, ₽">
                <input type="number" min="0" step="1" {...register("costPriceRub")} className="admin-input" />
              </AdminField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Статус наличия">
                <select {...register("availabilityStatus")} className="admin-input">
                  <option value="in_stock">В наличии</option>
                  <option value="limited">Мало</option>
                  <option value="out_of_stock">Нет в наличии</option>
                  <option value="preorder">Предзаказ</option>
                </select>
              </AdminField>
              <AdminField label="Количество">
                <input type="number" min="0" {...register("stockQuantity")} className="admin-input" />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection title="Категории">
            <AdminField label="Основная категория" error={errors.primaryCategoryId?.message}>
              <select
                {...register("primaryCategoryId")}
                className="admin-input"
                onChange={(event) => {
                  setValue("primaryCategoryId", event.target.value);
                  if (!selectedCategoryIds.includes(event.target.value)) {
                    setValue("categoryIds", [
                      ...selectedCategoryIds,
                      event.target.value,
                    ]);
                  }
                }}
              >
                <option value="">Выберите</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <fieldset>
              <legend className="text-sm font-bold text-slate-700">
                Все категории
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <label key={category.id} className="admin-check">
                    <input
                      type="checkbox"
                      value={category.id}
                      {...register("categoryIds")}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              {errors.categoryIds?.message ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.categoryIds.message}
                </p>
              ) : null}
            </fieldset>
          </AdminSection>

          <ImageEditor images={images} onChange={setImages} />
          <OptionEditor options={options} onChange={setOptions} />
          <AttributeEditor attributes={attributes} onChange={setAttributes} />

          <AdminSection title="Отметки и публикация">
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckField label="Под заказ" registration={register("isMadeToOrder")} />
              <CheckField label="Хит" registration={register("isBestseller")} />
              <CheckField label="Новинка" registration={register("isNew")} />
              <CheckField label="Рекомендуем" registration={register("isRecommended")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Порядок">
                <input type="number" min="0" {...register("sortOrder")} className="admin-input" />
              </AdminField>
              <AdminField label="Публикация">
                <select {...register("publicationStatus")} className="admin-input">
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                  <option value="hidden">Скрыт</option>
                </select>
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection title="SEO">
            <AdminField label="SEO-заголовок">
              <input {...register("seoTitle")} className="admin-input" />
            </AdminField>
            <AdminField label="SEO-описание">
              <textarea {...register("seoDescription")} className="admin-input min-h-20" />
            </AdminField>
          </AdminSection>

          {notice ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              {notice}
            </p>
          ) : null}
          <button type="submit" className="admin-primary w-full">
            {editingId ? "Сохранить товар" : "Добавить товар"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-rose-600">
              {products.length} товаров
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Товарный каталог
            </h2>
          </div>
          <button type="button" onClick={startCreate} className="admin-primary">
            + Добавить
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="admin-input mt-5"
          placeholder="Поиск по названию, slug или артикулу"
        />
        <div className="mt-4 grid gap-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{product.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {product.publicationStatus === "published"
                        ? "Опубликован"
                        : product.publicationStatus === "hidden"
                          ? "Скрыт"
                          : "Черновик"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.sku} · /{product.slug}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="font-bold text-slate-800">
                      {formatMoney({
                        amountKopecks:
                          product.salePriceKopecks ??
                          product.regularPriceKopecks,
                        currency: "RUB",
                      })}
                    </span>
                    <span className="text-slate-500">
                      Себестоимость:{" "}
                      {product.costPriceKopecks === null
                        ? "не указана"
                        : formatMoney({
                            amountKopecks: product.costPriceKopecks,
                            currency: "RUB",
                          })}
                    </span>
                    <span className="text-slate-500">
                      Опций: {product.options.length}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Создан:{" "}
                    {new Date(product.createdAt).toLocaleDateString("ru-RU")}
                    {" · "}
                    Обновлён:{" "}
                    {new Date(product.updatedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(product)} className="admin-secondary">
                    Изменить
                  </button>
                  <button type="button" onClick={() => toggleVisibility(product)} className="admin-secondary">
                    {product.publicationStatus === "published" ? "Скрыть" : "Опубликовать"}
                  </button>
                  <button type="button" onClick={() => handleDelete(product)} className="admin-danger">
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-4 border-t border-slate-200 pt-5">
      <legend className="pr-3 text-base font-black text-slate-950">{title}</legend>
      {children}
    </fieldset>
  );
}

function AdminField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      {label}
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function CheckField({
  label,
  registration,
}: {
  label: string;
  registration: ReturnType<ReturnType<typeof useForm<ProductFormValues>>["register"]>;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" {...registration} />
      {label}
    </label>
  );
}

function ImageEditor({
  images,
  onChange,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  function update(id: string, patch: Partial<ProductImage>) {
    onChange(
      images.map((image) =>
        image.id === id
          ? {
              ...image,
              ...patch,
            }
          : patch.isPrimary
            ? { ...image, isPrimary: false }
            : image,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[index],
    ];
    onChange(reordered);
  }

  return (
    <AdminSection title="Фотографии">
      {images.map((image, index) => (
        <div key={image.id} className="grid gap-2 rounded-xl bg-slate-50 p-3">
          <input
            value={image.src}
            onChange={(event) => update(image.id, { src: event.target.value })}
            className="admin-input"
            aria-label={`Путь фотографии ${index + 1}`}
          />
          <input
            value={image.alt}
            onChange={(event) => update(image.id, { alt: event.target.value })}
            className="admin-input"
            aria-label={`Описание фотографии ${index + 1}`}
          />
          <div className="flex flex-wrap gap-3">
            <label className="admin-check">
              <input
                type="radio"
                name="primary-image"
                checked={image.isPrimary}
                onChange={() => update(image.id, { isPrimary: true })}
              />
              Главное
            </label>
            <button
              type="button"
              className="admin-secondary"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label="Переместить фотографию выше"
            >
              ↑
            </button>
            <button
              type="button"
              className="admin-secondary"
              disabled={index === images.length - 1}
              onClick={() => move(index, 1)}
              aria-label="Переместить фотографию ниже"
            >
              ↓
            </button>
            <button
              type="button"
              className="admin-danger"
              onClick={() => onChange(images.filter((item) => item.id !== image.id))}
            >
              Удалить фото
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-secondary"
        onClick={() =>
          onChange([
            ...images,
            {
              id: createId("image"),
              src: "/social-preview.png",
              alt: "Дополнительная фотография",
              sortOrder: images.length,
              isPrimary: images.length === 0,
            },
          ])
        }
      >
        + Добавить фотографию
      </button>
    </AdminSection>
  );
}

function OptionEditor({
  options,
  onChange,
}: {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
}) {
  function updateOption(id: string, patch: Partial<ProductOption>) {
    onChange(
      options.map((option) =>
        option.id === id ? { ...option, ...patch } : option,
      ),
    );
  }

  function updateValue(
    optionId: string,
    valueId: string,
    patch: Partial<ProductOptionValue>,
  ) {
    onChange(
      options.map((option) =>
        option.id === optionId
          ? {
              ...option,
              values: option.values.map((value) =>
                value.id === valueId ? { ...value, ...patch } : value,
              ),
            }
          : option,
      ),
    );
  }

  return (
    <AdminSection title="Варианты и доплаты">
      <p className="text-sm leading-6 text-slate-500">
        Создавайте любые опции: цвет, размер, надпись, ленту, упаковку или
        Hi-Float. Новая колонка базы для этого не нужна.
      </p>
      {options.map((option) => (
        <div key={option.id} className="grid gap-3 rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={option.name}
              onChange={(event) =>
                updateOption(option.id, { name: event.target.value })
              }
              className="admin-input"
              placeholder="Название опции"
            />
            <input
              value={option.code}
              onChange={(event) =>
                updateOption(option.id, { code: event.target.value })
              }
              className="admin-input"
              placeholder="code"
            />
          </div>
          {option.values.map((value) => (
            <div
              key={value.id}
              className="grid grid-cols-[1fr_110px_auto] items-center gap-2"
            >
              <input
                value={value.label}
                onChange={(event) =>
                  updateValue(option.id, value.id, {
                    label: event.target.value,
                    value: event.target.value
                      .toLocaleLowerCase("ru")
                      .replaceAll(" ", "-"),
                  })
                }
                className="admin-input"
                aria-label="Значение опции"
              />
              <input
                type="number"
                value={value.priceModifierKopecks / 100}
                onChange={(event) =>
                  updateValue(option.id, value.id, {
                    priceModifierKopecks:
                      Math.round(Number(event.target.value) * 100) || 0,
                  })
                }
                className="admin-input"
                aria-label="Доплата в рублях"
              />
              <button
                type="button"
                className="admin-danger"
                aria-label="Удалить значение"
                onClick={() =>
                  updateOption(option.id, {
                    values: option.values.filter((item) => item.id !== value.id),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-secondary"
              onClick={() =>
                updateOption(option.id, {
                  values: [
                    ...option.values,
                    {
                      id: createId("option-value"),
                      label: "Новое значение",
                      value: `value-${option.values.length + 1}`,
                      priceModifierKopecks: 0,
                      sortOrder: option.values.length,
                    },
                  ],
                })
              }
            >
              + Значение
            </button>
            <button
              type="button"
              className="admin-danger"
              onClick={() =>
                onChange(options.filter((item) => item.id !== option.id))
              }
            >
              Удалить опцию
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-secondary"
        onClick={() =>
          onChange([
            ...options,
            {
              id: createId("option"),
              code: `option_${options.length + 1}`,
              name: "Новая опция",
              type: "select",
              required: true,
              sortOrder: options.length,
              values: [],
            },
          ])
        }
      >
        + Добавить универсальную опцию
      </button>
    </AdminSection>
  );
}

function AttributeEditor({
  attributes,
  onChange,
}: {
  attributes: DraftAttribute[];
  onChange: (attributes: DraftAttribute[]) => void;
}) {
  function update(id: string, patch: Partial<DraftAttribute>) {
    onChange(
      attributes.map((attribute) =>
        attribute.id === id ? { ...attribute, ...patch } : attribute,
      ),
    );
  }

  return (
    <AdminSection title="Характеристики">
      {attributes.map((attribute) => (
        <div key={attribute.id} className="grid gap-2 rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={attribute.name}
              onChange={(event) => update(attribute.id, { name: event.target.value })}
              className="admin-input"
              placeholder="Название"
            />
            <input
              value={attribute.code}
              onChange={(event) => update(attribute.id, { code: event.target.value })}
              className="admin-input"
              placeholder="code"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[130px_1fr_90px]">
            <select
              value={attribute.type}
              onChange={(event) =>
                update(attribute.id, {
                  type: event.target.value as DraftAttribute["type"],
                })
              }
              className="admin-input"
            >
              <option value="text">Текст</option>
              <option value="number">Число</option>
              <option value="boolean">Да/нет</option>
              <option value="color">Цвет</option>
              <option value="multiselect">Список</option>
            </select>
            <input
              value={attribute.value}
              onChange={(event) => update(attribute.id, { value: event.target.value })}
              className="admin-input"
              placeholder="Для списка — через запятую"
            />
            <input
              value={attribute.unit ?? ""}
              onChange={(event) =>
                update(attribute.id, { unit: event.target.value || null })
              }
              className="admin-input"
              placeholder="Ед."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={attribute.filterable}
                onChange={(event) =>
                  update(attribute.id, { filterable: event.target.checked })
                }
              />
              Показывать в фильтрах
            </label>
            <button
              type="button"
              className="admin-danger"
              onClick={() =>
                onChange(attributes.filter((item) => item.id !== attribute.id))
              }
            >
              Удалить характеристику
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-secondary"
        onClick={() =>
          onChange([
            ...attributes,
            {
              id: createId("attribute"),
              code: `attribute_${attributes.length + 1}`,
              name: "Новая характеристика",
              type: "text",
              value: "",
              unit: null,
              filterable: false,
              sortOrder: attributes.length,
            },
          ])
        }
      >
        + Добавить характеристику
      </button>
    </AdminSection>
  );
}
