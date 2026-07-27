"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { categoryFormSchema } from "@/features/catalog/schemas";
import { useCatalogStore } from "@/features/catalog/store";
import type { Category } from "@/features/catalog/types";
import { useHydrated } from "@/lib/use-hydrated";

type CategoryFormValues = z.input<typeof categoryFormSchema>;

const emptyForm: CategoryFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  image: "/og.png",
  parentId: "",
  sortOrder: 0,
  publicationStatus: "draft",
  seoTitle: "",
  seoDescription: "",
};

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function CategoryManager() {
  const hydrated = useHydrated();
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const saveCategory = useCatalogStore((state) => state.saveCategory);
  const deleteCategory = useCatalogStore((state) => state.deleteCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyForm,
  });

  const sorted = [...categories].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );

  function startEdit(category: Category) {
    setEditingId(category.id);
    reset({
      name: category.name,
      slug: category.slug,
      shortDescription: category.shortDescription,
      fullDescription: category.fullDescription,
      image: category.image,
      parentId: category.parentId ?? "",
      sortOrder: category.sortOrder,
      publicationStatus: category.publicationStatus,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
    });
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setNotice("");
  }

  function onSubmit(values: CategoryFormValues) {
    const parsed = categoryFormSchema.parse(values);
    const duplicateSlug = categories.some(
      (category) =>
        category.slug === parsed.slug && category.id !== editingId,
    );
    if (duplicateSlug) {
      setNotice("Такой slug уже используется другой категорией.");
      return;
    }
    if (parsed.parentId === editingId) {
      setNotice("Категория не может быть родителем самой себе.");
      return;
    }

    const current = categories.find((category) => category.id === editingId);
    const now = new Date().toISOString();
    saveCategory({
      id: current?.id ?? createId("category"),
      ...parsed,
      parentId: parsed.parentId || null,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
    setNotice(current ? "Категория обновлена." : "Категория добавлена.");
    setEditingId(null);
    reset(emptyForm);
  }

  function handleDelete(category: Category) {
    const hasChildren = categories.some(
      (item) => item.parentId === category.id,
    );
    const hasProducts = products.some((product) =>
      product.categoryIds.includes(category.id),
    );
    if (hasChildren || hasProducts) {
      window.alert(
        "Категория используется. Сначала перенесите подкатегории и товары либо просто скройте её.",
      );
      return;
    }
    if (window.confirm(`Удалить категорию «${category.name}»?`)) {
      deleteCategory(category.id);
    }
  }

  function toggleVisibility(category: Category) {
    saveCategory({
      ...category,
      publicationStatus:
        category.publicationStatus === "published" ? "hidden" : "published",
      updatedAt: new Date().toISOString(),
    });
  }

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-3xl border border-slate-200 bg-white p-5 xl:sticky xl:top-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-950">
            {editingId ? "Редактирование" : "Новая категория"}
          </h1>
          {editingId ? (
            <button type="button" onClick={startCreate} className="admin-link">
              Отмена
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Изменения сразу видны в каталоге на этом устройстве.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
          <AdminField label="Название" error={errors.name?.message}>
            <input {...register("name")} className="admin-input" />
          </AdminField>
          <AdminField label="Slug" error={errors.slug?.message}>
            <input
              {...register("slug")}
              className="admin-input"
              placeholder="den-rozhdeniya"
            />
          </AdminField>
          <AdminField label="Краткое описание">
            <textarea {...register("shortDescription")} className="admin-input min-h-20" />
          </AdminField>
          <AdminField label="Полное описание">
            <textarea {...register("fullDescription")} className="admin-input min-h-28" />
          </AdminField>
          <AdminField label="Локальный путь изображения">
            <input {...register("image")} className="admin-input" />
          </AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Родитель">
              <select {...register("parentId")} className="admin-input">
                <option value="">Нет</option>
                {sorted
                  .filter((category) => category.id !== editingId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </AdminField>
            <AdminField label="Порядок">
              <input
                type="number"
                min="0"
                {...register("sortOrder")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <AdminField label="Публикация">
            <select {...register("publicationStatus")} className="admin-input">
              <option value="draft">Черновик</option>
              <option value="published">Опубликована</option>
              <option value="hidden">Скрыта</option>
            </select>
          </AdminField>
          <AdminField label="SEO-заголовок">
            <input {...register("seoTitle")} className="admin-input" />
          </AdminField>
          <AdminField label="SEO-описание">
            <textarea {...register("seoDescription")} className="admin-input min-h-20" />
          </AdminField>
          {notice ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              {notice}
            </p>
          ) : null}
          <button type="submit" className="admin-primary">
            {editingId ? "Сохранить изменения" : "Добавить категорию"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-rose-600">
              {categories.length} категорий
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Структура каталога
            </h2>
          </div>
          <button type="button" onClick={startCreate} className="admin-primary">
            + Добавить
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {sorted.map((category) => {
            const parent = categories.find(
              (item) => item.id === category.parentId,
            );
            return (
              <article
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-950">{category.name}</h3>
                      <StatusBadge status={category.publicationStatus} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      /{category.slug}
                      {parent ? ` · внутри «${parent.name}»` : " · верхний уровень"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {category.shortDescription}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Создана:{" "}
                      {new Date(category.createdAt).toLocaleDateString("ru-RU")}
                      {" · "}
                      Обновлена:{" "}
                      {new Date(category.updatedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="admin-secondary"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(category)}
                      className="admin-secondary"
                    >
                      {category.publicationStatus === "published"
                        ? "Скрыть"
                        : "Опубликовать"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="admin-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
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

function StatusBadge({ status }: { status: Category["publicationStatus"] }) {
  const labels = {
    published: "Опубликована",
    draft: "Черновик",
    hidden: "Скрыта",
  };
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      {labels[status]}
    </span>
  );
}
