"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAdminData } from "@/features/admin/data/admin-data-provider";
import {
  deleteDeliveryZone,
  saveDeliveryZone,
} from "@/features/admin/data/browser-repository";
import { deliveryZoneFormSchema } from "@/features/admin/data/schemas";
import type { DeliveryZone } from "@/features/admin/data/types";
import { formatMoney } from "@/lib/money";

type DeliveryFormValues = z.input<typeof deliveryZoneFormSchema>;

const emptyForm: DeliveryFormValues = {
  name: "",
  slug: "",
  description: "",
  basePriceRub: 0,
  pricePerKmRub: 0,
  freeFromRub: "",
  minimumOrderRub: 0,
  urgentSurchargeRub: 0,
  deliveryIntervals: "10:00–13:00\n13:00–16:00\n16:00–19:00\n19:00–22:00",
  isActive: true,
  sortOrder: 0,
};

function valuesFromZone(zone: DeliveryZone): DeliveryFormValues {
  return {
    name: zone.name,
    slug: zone.slug,
    description: zone.description,
    basePriceRub: zone.basePriceKopecks / 100,
    pricePerKmRub: zone.pricePerKmKopecks / 100,
    freeFromRub:
      zone.freeFromKopecks === null ? "" : zone.freeFromKopecks / 100,
    minimumOrderRub: zone.minimumOrderKopecks / 100,
    urgentSurchargeRub: zone.urgentSurchargeKopecks / 100,
    deliveryIntervals: zone.deliveryIntervals.join("\n"),
    isActive: zone.isActive,
    sortOrder: zone.sortOrder,
  };
}

export function DeliveryManager() {
  const { deliveryZones, isLoading, updateSnapshot } = useAdminData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryZoneFormSchema),
    defaultValues: emptyForm,
  });

  function startEdit(zone: DeliveryZone) {
    setEditingId(zone.id);
    reset(valuesFromZone(zone));
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setNotice("");
  }

  async function onSubmit(values: DeliveryFormValues) {
    const parsed = deliveryZoneFormSchema.parse(values);
    const current = deliveryZones.find((zone) => zone.id === editingId);
    const now = new Date().toISOString();
    const zone: DeliveryZone = {
      id: current?.id ?? crypto.randomUUID(),
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      basePriceKopecks: Math.round(parsed.basePriceRub * 100),
      pricePerKmKopecks: Math.round(parsed.pricePerKmRub * 100),
      freeFromKopecks:
        parsed.freeFromRub === ""
          ? null
          : Math.round(parsed.freeFromRub * 100),
      minimumOrderKopecks: Math.round(parsed.minimumOrderRub * 100),
      urgentSurchargeKopecks: Math.round(
        parsed.urgentSurchargeRub * 100,
      ),
      deliveryIntervals: parsed.deliveryIntervals
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: parsed.isActive,
      sortOrder: parsed.sortOrder,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await saveDeliveryZone(zone);
      updateSnapshot((snapshot) => {
        const exists = snapshot.deliveryZones.some(
          (item) => item.id === zone.id,
        );
        return {
          ...snapshot,
          deliveryZones: (
            exists
              ? snapshot.deliveryZones.map((item) =>
                  item.id === zone.id ? zone : item,
                )
              : [...snapshot.deliveryZones, zone]
          ).sort((first, second) => first.sortOrder - second.sortOrder),
        };
      });
      setEditingId(null);
      reset(emptyForm);
      setNoticeTone("success");
      setNotice(current ? "Зона доставки обновлена." : "Зона доставки добавлена.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось сохранить зону доставки.");
    }
  }

  async function toggle(zone: DeliveryZone) {
    const updated = {
      ...zone,
      isActive: !zone.isActive,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveDeliveryZone(updated);
      updateSnapshot((snapshot) => ({
        ...snapshot,
        deliveryZones: snapshot.deliveryZones.map((item) =>
          item.id === zone.id ? updated : item,
        ),
      }));
      setNoticeTone("success");
      setNotice(updated.isActive ? "Зона включена." : "Зона скрыта.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось изменить доступность зоны.");
    }
  }

  async function remove(zone: DeliveryZone) {
    if (
      !window.confirm(
        `Удалить зону «${zone.name}»? Если она используется в заказах, база не разрешит удаление.`,
      )
    ) {
      return;
    }
    try {
      await deleteDeliveryZone(zone.id);
      updateSnapshot((snapshot) => ({
        ...snapshot,
        deliveryZones: snapshot.deliveryZones.filter(
          (item) => item.id !== zone.id,
        ),
      }));
      setNoticeTone("success");
      setNotice("Зона доставки удалена.");
    } catch {
      setNoticeTone("error");
      setNotice("Зону нельзя удалить: она используется в заказах.");
    }
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 xl:sticky xl:top-32">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              Доставка по Москве и области
            </p>
            <h1 className="mt-2 text-2xl font-black">
              {editingId ? "Изменить зону" : "Новая зона"}
            </h1>
          </div>
          {editingId ? (
            <button type="button" onClick={startCreate} className="admin-link">
              Отмена
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
          <AdminField label="Название" error={errors.name?.message}>
            <input {...register("name")} className="admin-input" />
          </AdminField>
          <AdminField label="Slug" error={errors.slug?.message}>
            <input {...register("slug")} className="admin-input" />
          </AdminField>
          <AdminField label="Описание">
            <textarea
              {...register("description")}
              className="admin-input min-h-20"
            />
          </AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Стоимость, ₽">
              <input
                type="number"
                min="0"
                {...register("basePriceRub")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="За 1 км, ₽">
              <input
                type="number"
                min="0"
                {...register("pricePerKmRub")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="Минимальный заказ, ₽">
              <input
                type="number"
                min="0"
                {...register("minimumOrderRub")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="Бесплатно от, ₽">
              <input
                type="number"
                min="0"
                {...register("freeFromRub")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <AdminField label="Доплата за срочность, ₽">
            <input
              type="number"
              min="0"
              {...register("urgentSurchargeRub")}
              className="admin-input"
            />
          </AdminField>
          <AdminField
            label="Временные интервалы, по одному на строке"
            error={errors.deliveryIntervals?.message}
          >
            <textarea
              {...register("deliveryIntervals")}
              className="admin-input min-h-28"
            />
          </AdminField>
          <AdminField label="Порядок">
            <input
              type="number"
              min="0"
              {...register("sortOrder")}
              className="admin-input"
            />
          </AdminField>
          <label className="admin-check">
            <input type="checkbox" {...register("isActive")} />
            Зона доступна покупателям
          </label>
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-primary"
          >
            {isSubmitting
              ? "Сохраняем…"
              : editingId
                ? "Сохранить зону"
                : "Добавить зону"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">
              {deliveryZones.length} зон
            </p>
            <h2 className="mt-1 text-3xl font-black">Доставка</h2>
          </div>
          <button type="button" onClick={startCreate} className="admin-primary">
            + Добавить
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          {deliveryZones.map((zone) => (
            <article
              key={zone.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{zone.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        zone.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {zone.isActive ? "Активна" : "Скрыта"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {zone.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <b>
                      От{" "}
                      {formatMoney({
                        amountKopecks: zone.basePriceKopecks,
                        currency: "RUB",
                      })}
                    </b>
                    <span className="text-slate-500">
                      Минимальный заказ:{" "}
                      {formatMoney({
                        amountKopecks: zone.minimumOrderKopecks,
                        currency: "RUB",
                      })}
                    </span>
                    <span className="text-slate-500">
                      Срочно: +{" "}
                      {formatMoney({
                        amountKopecks: zone.urgentSurchargeKopecks,
                        currency: "RUB",
                      })}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Интервалы: {zone.deliveryIntervals.join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(zone)}
                    className="admin-secondary"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggle(zone)}
                    className="admin-secondary"
                  >
                    {zone.isActive ? "Скрыть" : "Включить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(zone)}
                    className="admin-danger"
                  >
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
