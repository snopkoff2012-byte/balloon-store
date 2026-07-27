"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { StorageImageUploader } from "@/features/admin/storage/storage-image-uploader";
import { productFormSchema } from "@/features/catalog/schemas";
import { useCatalogStore } from "@/features/catalog/store";
import type {
  Product,
  ProductAttribute,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
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

function createId() {
  return crypto.randomUUID();
}

const defaultImages = (): ProductImage[] => [
  {
    id: createId(),
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [images, setImages] = useState<ProductImage[]>(defaultImages);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
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
  const previewValues = useWatch({ control });
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return [...products]
      .filter((product) => {
        const matchesQuery = normalized
          ? `${product.name} ${product.sku} ${product.slug}`
              .toLocaleLowerCase("ru")
              .includes(normalized)
          : true;
        const matchesCategory =
          categoryFilter === "all" ||
          product.categoryIds.includes(categoryFilter);
        const matchesStatus =
          statusFilter === "all" ||
          product.publicationStatus === statusFilter;
        const matchesAvailability =
          availabilityFilter === "all" ||
          product.availabilityStatus === availabilityFilter;
        return (
          matchesQuery &&
          matchesCategory &&
          matchesStatus &&
          matchesAvailability
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [
    availabilityFilter,
    categoryFilter,
    products,
    query,
    statusFilter,
  ]);

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setImages(defaultImages());
    setOptions([]);
    setVariants([]);
    setAttributes([]);
    setNotice("");
    setShowPreview(false);
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
    setVariants(product.variants);
    setAttributes(attributesToDraft(product.attributes));
    setNotice("");
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startDuplicate(product: Product) {
    const valueIdMap = new Map<string, string>();
    const duplicatedOptions = product.options.map((option) => ({
      ...option,
      id: createId(),
      values: option.values.map((value) => {
        const id = createId();
        valueIdMap.set(value.id, id);
        return { ...value, id };
      }),
    }));
    setEditingId(null);
    reset({
      name: `${product.name} — копия`,
      slug: `${product.slug}-copy`,
      sku: `${product.sku}-COPY`,
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
      isBestseller: false,
      isNew: true,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder + 1,
      seoTitle: "",
      seoDescription: product.seoDescription,
      publicationStatus: "draft",
    });
    setImages(
      product.images.map((image) => ({ ...image, id: createId() })),
    );
    setOptions(duplicatedOptions);
    setVariants(
      product.variants.map((variant, index) => ({
        ...variant,
        id: createId(),
        sku: `${variant.sku}-COPY-${index + 1}`,
        optionValueIds: variant.optionValueIds
          .map((id) => valueIdMap.get(id))
          .filter((id): id is string => Boolean(id)),
      })),
    );
    setAttributes(
      attributesToDraft(product.attributes).map((attribute) => ({
        ...attribute,
        id: createId(),
      })),
    );
    setNoticeTone("success");
    setNotice("Создана копия. Измените slug и артикул при необходимости.");
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: ProductFormValues) {
    const parsed = productFormSchema.parse(values);
    if (
      products.some(
        (product) => product.slug === parsed.slug && product.id !== editingId,
      )
    ) {
      setNoticeTone("error");
      setNotice("Такой slug уже используется.");
      return;
    }
    if (
      products.some(
        (product) => product.sku === parsed.sku && product.id !== editingId,
      )
    ) {
      setNoticeTone("error");
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
    const id = current?.id ?? createId();
    const stockQuantity =
      parsed.stockQuantity === "" ? null : parsed.stockQuantity;

    const productToSave: Product = {
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
      variants:
        variants.length > 0
          ? variants
          : [
              {
                id: current?.variants[0]?.id ?? createId(),
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
    };

    try {
      await saveProduct(productToSave);
      setNoticeTone("success");
      setNotice(current ? "Товар обновлён." : "Товар добавлен.");
      setEditingId(null);
      reset(emptyForm);
      setImages(defaultImages());
      setOptions([]);
      setVariants([]);
      setAttributes([]);
    } catch {
      setNoticeTone("error");
      setNotice(
        "Не удалось сохранить товар. Проверьте вход администратора и соединение.",
      );
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      await saveProduct({
        ...product,
        publicationStatus:
          product.publicationStatus === "published" ? "hidden" : "published",
        updatedAt: new Date().toISOString(),
      });
      setNoticeTone("success");
      setNotice(
        product.publicationStatus === "published"
          ? "Товар скрыт."
          : "Товар опубликован.",
      );
    } catch {
      setNoticeTone("error");
      setNotice(
        "Не удалось изменить публикацию. Проверьте вход администратора и соединение.",
      );
    }
  }

  async function handleDelete(product: Product) {
    if (
      window.confirm(
        `Удалить тестовый товар «${product.name}»? В реальной базе товары из заказов будут только архивироваться.`,
      )
    ) {
      try {
        await deleteProduct(product.id);
        setNoticeTone("success");
        setNotice("Товар удалён.");
      } catch {
        setNoticeTone("error");
        setNotice(
          "Не удалось удалить товар. Проверьте вход администратора и связанные заказы.",
        );
      }
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
          <VariantEditor
            variants={variants}
            options={options}
            productSku={previewValues.sku ?? ""}
            onChange={setVariants}
          />
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

          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="admin-secondary w-full"
          >
            {showPreview ? "Скрыть предпросмотр" : "Предварительный просмотр"}
          </button>
          {showPreview ? (
            <ProductPreview
              name={previewValues.name ?? ""}
              description={previewValues.shortDescription ?? ""}
              regularPriceRub={Number(previewValues.regularPriceRub ?? 0)}
              salePriceRub={
                previewValues.salePriceRub === ""
                  ? null
                  : Number(previewValues.salePriceRub ?? 0)
              }
              image={images.find((image) => image.isPrimary) ?? images[0]}
              optionCount={options.length}
            />
          ) : null}

          {notice ? (
            <p
              role={noticeTone === "error" ? "alert" : "status"}
              className={`rounded-xl p-3 text-sm font-semibold ${
                noticeTone === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {notice}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="admin-secondary w-full"
              onClick={() =>
                void handleSubmit((values) =>
                  onSubmit({ ...values, publicationStatus: "draft" }),
                )()
              }
            >
              Сохранить черновик
            </button>
            <button
              type="button"
              className="admin-primary w-full"
              onClick={() =>
                void handleSubmit((values) =>
                  onSubmit({ ...values, publicationStatus: "published" }),
                )()
              }
            >
              Опубликовать товар
            </button>
          </div>
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
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="admin-input sm:col-span-2 xl:col-span-1"
            placeholder="Название, slug или артикул"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="admin-input"
            aria-label="Фильтр по категории"
          >
            <option value="all">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="admin-input"
            aria-label="Фильтр по публикации"
          >
            <option value="all">Все публикации</option>
            <option value="published">Опубликованные</option>
            <option value="draft">Черновики</option>
            <option value="hidden">Скрытые</option>
          </select>
          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
            className="admin-input"
            aria-label="Фильтр по наличию"
          >
            <option value="all">Любое наличие</option>
            <option value="in_stock">В наличии</option>
            <option value="limited">Мало</option>
            <option value="out_of_stock">Нет в наличии</option>
            <option value="preorder">Предзаказ</option>
          </select>
        </div>
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
                  <button type="button" onClick={() => startDuplicate(product)} className="admin-secondary">
                    Дублировать
                  </button>
                  {product.publicationStatus === "published" ? (
                    <Link
                      href={`/product/${product.slug}`}
                      target="_blank"
                      className="admin-secondary"
                    >
                      Посмотреть
                    </Link>
                  ) : null}
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
          {filteredProducts.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">
              Товары по выбранным фильтрам не найдены.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ProductPreview({
  name,
  description,
  regularPriceRub,
  salePriceRub,
  image,
  optionCount,
}: {
  name: string;
  description: string;
  regularPriceRub: number;
  salePriceRub: number | null;
  image?: ProductImage;
  optionCount: number;
}) {
  return (
    <section
      aria-label="Предварительный просмотр товара"
      className="overflow-hidden rounded-3xl border border-rose-200 bg-rose-50"
    >
      <div
        className="aspect-[16/10] bg-cover bg-center"
        style={
          image
            ? {
                backgroundImage: `linear-gradient(rgb(15 23 42 / 0.08), rgb(15 23 42 / 0.08)), url("${image.src}")`,
              }
            : undefined
        }
      />
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-600">
          Предпросмотр карточки
        </p>
        <h3 className="mt-2 text-xl font-black">
          {name || "Название товара"}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {description || "Краткое описание появится здесь."}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xl font-black text-rose-700">
              {formatMoney({
                amountKopecks: Math.round(
                  (salePriceRub ?? regularPriceRub) * 100,
                ),
                currency: "RUB",
              })}
            </p>
            {salePriceRub !== null ? (
              <p className="text-xs text-slate-500 line-through">
                {formatMoney({
                  amountKopecks: Math.round(regularPriceRub * 100),
                  currency: "RUB",
                })}
              </p>
            ) : null}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {optionCount
              ? `${optionCount} настраиваемых опций`
              : "Без дополнительных опций"}
          </span>
        </div>
      </div>
    </section>
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
      <StorageImageUploader
        folder="products"
        multiple
        onUploaded={(uploaded) =>
          onChange([
            ...images,
            ...uploaded.map((image, index) => ({
              id: createId(),
              src: image.url,
              alt: image.name.replace(/\.[^.]+$/, ""),
              sortOrder: images.length + index,
              isPrimary: images.length === 0 && index === 0,
            })),
          ])
        }
      />
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
              id: createId(),
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
                      id: createId(),
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
              id: createId(),
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

function VariantEditor({
  variants,
  options,
  productSku,
  onChange,
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  productSku: string;
  onChange: (variants: ProductVariant[]) => void;
}) {
  const optionValues = options.flatMap((option) =>
    option.values.map((value) => ({
      ...value,
      optionName: option.name,
    })),
  );

  function update(id: string, patch: Partial<ProductVariant>) {
    onChange(
      variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function toggleValue(variant: ProductVariant, valueId: string) {
    update(variant.id, {
      optionValueIds: variant.optionValueIds.includes(valueId)
        ? variant.optionValueIds.filter((id) => id !== valueId)
        : [...variant.optionValueIds, valueId],
    });
  }

  return (
    <AdminSection title="Продаваемые варианты">
      <p className="text-sm leading-6 text-slate-500">
        Вариант может иметь собственный артикул, доплату, остаток и набор
        значений опций.
      </p>
      {variants.map((variant, index) => (
        <div
          key={variant.id}
          className="grid gap-3 rounded-xl bg-slate-50 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={variant.sku}
              onChange={(event) =>
                update(variant.id, { sku: event.target.value })
              }
              className="admin-input"
              aria-label={`Артикул варианта ${index + 1}`}
              placeholder="Артикул варианта"
            />
            <input
              type="number"
              value={variant.priceModifierKopecks / 100}
              onChange={(event) =>
                update(variant.id, {
                  priceModifierKopecks:
                    Math.round(Number(event.target.value) * 100) || 0,
                })
              }
              className="admin-input"
              aria-label={`Доплата варианта ${index + 1} в рублях`}
              placeholder="Доплата, ₽"
            />
            <input
              type="number"
              min="0"
              value={variant.stockQuantity ?? ""}
              onChange={(event) =>
                update(variant.id, {
                  stockQuantity:
                    event.target.value === ""
                      ? null
                      : Math.max(0, Number(event.target.value)),
                })
              }
              className="admin-input"
              aria-label={`Остаток варианта ${index + 1}`}
              placeholder="Остаток"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={variant.availabilityStatus}
              onChange={(event) =>
                update(variant.id, {
                  availabilityStatus: event.target
                    .value as ProductVariant["availabilityStatus"],
                })
              }
              className="admin-input"
              aria-label={`Наличие варианта ${index + 1}`}
            >
              <option value="in_stock">В наличии</option>
              <option value="limited">Мало</option>
              <option value="out_of_stock">Нет в наличии</option>
              <option value="preorder">Предзаказ</option>
            </select>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={variant.active}
                onChange={(event) =>
                  update(variant.id, { active: event.target.checked })
                }
              />
              Вариант активен
            </label>
          </div>
          {optionValues.length ? (
            <fieldset>
              <legend className="text-xs font-bold text-slate-600">
                Значения опций
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {optionValues.map((value) => (
                  <label key={value.id} className="admin-check">
                    <input
                      type="checkbox"
                      checked={variant.optionValueIds.includes(value.id)}
                      onChange={() => toggleValue(variant, value.id)}
                    />
                    {value.optionName}: {value.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <button
            type="button"
            className="admin-danger w-fit"
            onClick={() =>
              onChange(variants.filter((item) => item.id !== variant.id))
            }
          >
            Удалить вариант
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-secondary"
        onClick={() =>
          onChange([
            ...variants,
            {
              id: createId(),
              sku: `${productSku || "VARIANT"}-${variants.length + 1}`,
              optionValueIds: [],
              priceModifierKopecks: 0,
              stockQuantity: 0,
              availabilityStatus: "in_stock",
              active: true,
            },
          ])
        }
      >
        + Добавить продаваемый вариант
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
              id: createId(),
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
