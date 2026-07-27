"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAdminData } from "@/features/admin/data/admin-data-provider";
import { saveStoreSettings } from "@/features/admin/data/browser-repository";
import { storeSettingsSchema } from "@/features/admin/data/schemas";

type SettingsFormValues = z.input<typeof storeSettingsSchema>;

export function SettingsManager() {
  const { settings, isLoading, updateSnapshot } = useAdminData();
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [reset, settings]);

  async function onSubmit(values: SettingsFormValues) {
    const parsed = storeSettingsSchema.parse(values);
    try {
      await saveStoreSettings(parsed);
      updateSnapshot((snapshot) => ({ ...snapshot, settings: parsed }));
      setNoticeTone("success");
      setNotice("Настройки сохранены.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось сохранить настройки. Попробуйте ещё раз.");
    }
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
          Контакты и содержание
        </p>
        <h1 className="mt-2 text-3xl font-black">Настройки сайта</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Эти данные можно менять без редактирования кода.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 grid gap-6">
        <SettingsSection
          title="Контакты"
          description="Покупатели увидят их на сайте и в контактных кнопках."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Телефон" error={errors.phone?.message}>
              <input {...register("phone")} className="admin-input" />
            </AdminField>
            <AdminField label="Электронная почта" error={errors.email?.message}>
              <input
                type="email"
                {...register("email")}
                className="admin-input"
              />
            </AdminField>
            <AdminField label="Telegram">
              <input {...register("telegram")} className="admin-input" />
            </AdminField>
            <AdminField label="WhatsApp">
              <input {...register("whatsapp")} className="admin-input" />
            </AdminField>
          </div>
          <AdminField label="Адрес">
            <input {...register("address")} className="admin-input" />
          </AdminField>
          <AdminField
            label="Часы работы"
            error={errors.workingHours?.message}
          >
            <input {...register("workingHours")} className="admin-input" />
          </AdminField>
        </SettingsSection>

        <SettingsSection
          title="Заказы"
          description="Общие ограничения магазина, не зависящие от зоны доставки."
        >
          <AdminField label="Минимальная сумма заказа, ₽">
            <input
              type="number"
              min="0"
              {...register("minimumOrderRub")}
              className="admin-input max-w-xs"
            />
          </AdminField>
        </SettingsSection>

        <SettingsSection
          title="Первый экран главной"
          description="Главное предложение магазина для новых посетителей."
        >
          <AdminField label="Надзаголовок" error={errors.homeEyebrow?.message}>
            <input {...register("homeEyebrow")} className="admin-input" />
          </AdminField>
          <AdminField label="Заголовок" error={errors.homeTitle?.message}>
            <input {...register("homeTitle")} className="admin-input" />
          </AdminField>
          <AdminField
            label="Описание"
            error={errors.homeDescription?.message}
          >
            <textarea
              {...register("homeDescription")}
              className="admin-input min-h-28"
            />
          </AdminField>
        </SettingsSection>

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
          className="admin-primary w-full sm:w-fit"
        >
          {isSubmitting ? "Сохраняем…" : "Сохранить настройки"}
        </button>
      </form>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
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
