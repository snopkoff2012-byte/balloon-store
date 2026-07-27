"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useAdminData } from "@/features/admin/data/admin-data-provider";
import {
  deletePromoCode,
  savePromoCode,
} from "@/features/admin/data/browser-repository";
import { promoCodeFormSchema } from "@/features/admin/data/schemas";
import type { PromoCode } from "@/features/admin/data/types";
import { formatMoney } from "@/lib/money";

type PromoFormValues = z.input<typeof promoCodeFormSchema>;

const emptyForm: PromoFormValues = {
  code: "",
  description: "",
  discountType: "percent",
  discountValueRubOrPercent: 10,
  minimumOrderRub: 0,
  maximumDiscountRub: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "",
  isActive: true,
};

function dateTimeLocal(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function valuesFromPromo(promo: PromoCode): PromoFormValues {
  return {
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValueRubOrPercent:
      promo.discountType === "fixed"
        ? promo.discountValue / 100
        : promo.discountValue,
    minimumOrderRub: promo.minimumOrderKopecks / 100,
    maximumDiscountRub:
      promo.maximumDiscountKopecks === null
        ? ""
        : promo.maximumDiscountKopecks / 100,
    startsAt: dateTimeLocal(promo.startsAt),
    endsAt: dateTimeLocal(promo.endsAt),
    usageLimit: promo.usageLimit ?? "",
    perCustomerLimit: promo.perCustomerLimit ?? "",
    isActive: promo.isActive,
  };
}

export function PromoManager() {
  const { promoCodes, isLoading, updateSnapshot } = useAdminData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PromoFormValues>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: emptyForm,
  });
  const discountType = useWatch({ control, name: "discountType" });

  function startEdit(promo: PromoCode) {
    setEditingId(promo.id);
    reset(valuesFromPromo(promo));
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCreate() {
    setEditingId(null);
    reset(emptyForm);
    setNotice("");
  }

  async function onSubmit(values: PromoFormValues) {
    const parsed = promoCodeFormSchema.parse(values);
    const current = promoCodes.find((promo) => promo.id === editingId);
    const now = new Date().toISOString();
    const promo: PromoCode = {
      id: current?.id ?? crypto.randomUUID(),
      code: parsed.code.toUpperCase(),
      description: parsed.description,
      discountType: parsed.discountType,
      discountValue:
        parsed.discountType === "fixed"
          ? Math.round(parsed.discountValueRubOrPercent * 100)
          : parsed.discountValueRubOrPercent,
      minimumOrderKopecks: Math.round(parsed.minimumOrderRub * 100),
      maximumDiscountKopecks:
        parsed.maximumDiscountRub === ""
          ? null
          : Math.round(parsed.maximumDiscountRub * 100),
      startsAt: parsed.startsAt
        ? new Date(parsed.startsAt).toISOString()
        : null,
      endsAt: parsed.endsAt ? new Date(parsed.endsAt).toISOString() : null,
      usageLimit: parsed.usageLimit === "" ? null : parsed.usageLimit,
      perCustomerLimit:
        parsed.perCustomerLimit === "" ? null : parsed.perCustomerLimit,
      usageCount: current?.usageCount ?? 0,
      isActive: parsed.isActive,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };

    if (
      promoCodes.some(
        (item) =>
          item.code.toUpperCase() === promo.code && item.id !== promo.id,
      )
    ) {
      setNoticeTone("error");
      setNotice("Такой промокод уже существует.");
      return;
    }
    if (
      promo.startsAt &&
      promo.endsAt &&
      new Date(promo.startsAt) >= new Date(promo.endsAt)
    ) {
      setNoticeTone("error");
      setNotice("Дата окончания должна быть позже даты начала.");
      return;
    }

    try {
      await savePromoCode(promo);
      updateSnapshot((snapshot) => {
        const exists = snapshot.promoCodes.some(
          (item) => item.id === promo.id,
        );
        return {
          ...snapshot,
          promoCodes: exists
            ? snapshot.promoCodes.map((item) =>
                item.id === promo.id ? promo : item,
              )
            : [promo, ...snapshot.promoCodes],
        };
      });
      setEditingId(null);
      reset(emptyForm);
      setNoticeTone("success");
      setNotice(current ? "Промокод обновлён." : "Промокод создан.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось сохранить промокод.");
    }
  }

  async function toggle(promo: PromoCode) {
    const updated = {
      ...promo,
      isActive: !promo.isActive,
      updatedAt: new Date().toISOString(),
    };
    try {
      await savePromoCode(updated);
      updateSnapshot((snapshot) => ({
        ...snapshot,
        promoCodes: snapshot.promoCodes.map((item) =>
          item.id === promo.id ? updated : item,
        ),
      }));
      setNoticeTone("success");
      setNotice(updated.isActive ? "Промокод включён." : "Промокод отключён.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось изменить промокод.");
    }
  }

  async function remove(promo: PromoCode) {
    if (!window.confirm(`Удалить промокод «${promo.code}»?`)) return;
    try {
      await deletePromoCode(promo.id);
      updateSnapshot((snapshot) => ({
        ...snapshot,
        promoCodes: snapshot.promoCodes.filter(
          (item) => item.id !== promo.id,
        ),
      }));
      setNoticeTone("success");
      setNotice("Промокод удалён.");
    } catch {
      setNoticeTone("error");
      setNotice("Промокод нельзя удалить: он уже использовался в заказах.");
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
              Скидки
            </p>
            <h1 className="mt-2 text-2xl font-black">
              {editingId ? "Изменить промокод" : "Новый промокод"}
            </h1>
          </div>
          {editingId ? (
            <button type="button" onClick={startCreate} className="admin-link">
              Отмена
            </button>
          ) : null}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
          <AdminField label="Промокод" error={errors.code?.message}>
            <input
              {...register("code", {
                onChange: (event) => {
                  event.target.value = event.target.value.toUpperCase();
                },
              })}
              className="admin-input uppercase"
              placeholder="WELCOME10"
            />
          </AdminField>
          <AdminField label="Описание">
            <textarea
              {...register("description")}
              className="admin-input min-h-20"
            />
          </AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Тип скидки">
              <select {...register("discountType")} className="admin-input">
                <option value="percent">Процент</option>
                <option value="fixed">Сумма</option>
              </select>
            </AdminField>
            <AdminField
              label={discountType === "fixed" ? "Скидка, ₽" : "Скидка, %"}
            >
              <input
                type="number"
                min="1"
                {...register("discountValueRubOrPercent")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Минимальный заказ, ₽">
              <input
                type="number"
                min="0"
                {...register("minimumOrderRub")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="Максимальная скидка, ₽">
              <input
                type="number"
                min="0"
                {...register("maximumDiscountRub")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Начало">
              <input
                type="datetime-local"
                {...register("startsAt")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="Окончание">
              <input
                type="datetime-local"
                {...register("endsAt")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Общий лимит">
              <input
                type="number"
                min="1"
                {...register("usageLimit")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="На покупателя">
              <input
                type="number"
                min="1"
                {...register("perCustomerLimit")}
                className="admin-input"
              />
            </AdminField>
          </div>
          <label className="admin-check">
            <input type="checkbox" {...register("isActive")} />
            Промокод активен
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
                ? "Сохранить промокод"
                : "Создать промокод"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">
              {promoCodes.length} промокодов
            </p>
            <h2 className="mt-1 text-3xl font-black">Промокоды</h2>
          </div>
          <button type="button" onClick={startCreate} className="admin-primary">
            + Добавить
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          {promoCodes.length ? (
            promoCodes.map((promo) => (
              <article
                key={promo.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black tracking-wide">
                        {promo.code}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          promo.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {promo.isActive ? "Активен" : "Отключён"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {promo.description || "Без описания"}
                    </p>
                    <p className="mt-3 font-bold text-rose-700">
                      {promo.discountType === "percent"
                        ? `${promo.discountValue}%`
                        : formatMoney({
                            amountKopecks: promo.discountValue,
                            currency: "RUB",
                          })}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Использовано {promo.usageCount}
                      {promo.usageLimit ? ` из ${promo.usageLimit}` : " раз"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(promo)}
                      className="admin-secondary"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(promo)}
                      className="admin-secondary"
                    >
                      {promo.isActive ? "Отключить" : "Включить"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(promo)}
                      className="admin-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-3xl bg-white p-8 text-center text-slate-500">
              Промокодов пока нет.
            </p>
          )}
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
