"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().min(2, "Укажите имя"),
  phone: z.string().min(10, "Укажите корректный телефон"),
  city: z.string().min(2, "Укажите город"),
  address: z.string().min(5, "Укажите адрес"),
  date: z.string().min(1, "Выберите дату"),
  interval: z.string().min(1, "Выберите интервал"),
  comment: z.string().max(500, "Не более 500 символов").optional(),
  consent: z
    .boolean()
    .refine((isAccepted) => isAccepted, "Необходимо согласие на обработку данных"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      interval: "",
      consent: false,
    },
  });

  if (isSubmitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
        <p className="text-4xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-4 text-2xl font-bold text-emerald-950">
          Демо-форма работает
        </h2>
        <p className="mt-3 leading-7 text-emerald-800">
          Данные прошли проверку, но заказ не был отправлен: реальная база будет
          подключена на следующем этапе.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
      onSubmit={handleSubmit(() => setIsSubmitted(true))}
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Имя" error={errors.name?.message}>
          <input
            {...register("name")}
            className="form-input"
            placeholder="Анна"
            autoComplete="name"
          />
        </Field>
        <Field label="Телефон" error={errors.phone?.message}>
          <input
            {...register("phone")}
            className="form-input"
            placeholder="+7 999 000-00-00"
            autoComplete="tel"
          />
        </Field>
        <Field label="Город" error={errors.city?.message}>
          <input
            {...register("city")}
            className="form-input"
            placeholder="Москва"
            autoComplete="address-level2"
          />
        </Field>
        <Field label="Адрес" error={errors.address?.message}>
          <input
            {...register("address")}
            className="form-input"
            placeholder="Улица, дом, квартира"
            autoComplete="street-address"
          />
        </Field>
        <Field label="Желаемая дата" error={errors.date?.message}>
          <input {...register("date")} type="date" className="form-input" />
        </Field>
        <Field label="Интервал доставки" error={errors.interval?.message}>
          <select {...register("interval")} className="form-input">
            <option value="">Выберите время</option>
            <option value="09-12">09:00–12:00</option>
            <option value="12-15">12:00–15:00</option>
            <option value="15-18">15:00–18:00</option>
            <option value="18-21">18:00–21:00</option>
          </select>
        </Field>
      </div>
      <Field label="Комментарий к заказу" error={errors.comment?.message}>
        <textarea
          {...register("comment")}
          className="form-input min-h-28 resize-y"
          placeholder="Код домофона, пожелания к композиции…"
        />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          {...register("consent")}
          type="checkbox"
          className="mt-1 size-4 rounded border-slate-300 accent-rose-600"
        />
        <span>
          Согласен на обработку данных для оформления демонстрационного заказа.
          {errors.consent ? (
            <span className="block font-medium text-red-600">
              {errors.consent.message}
            </span>
          ) : null}
        </span>
      </label>
      <button
        type="submit"
        className="rounded-2xl bg-rose-600 px-6 py-4 font-bold text-white hover:bg-rose-700"
      >
        Проверить оформление
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      {children}
      {error ? (
        <span className="text-sm font-normal text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
