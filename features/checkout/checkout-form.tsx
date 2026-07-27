"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCatalogStore } from "@/features/catalog/store";
import { getCartItemAvailability } from "@/features/cart/availability";
import { getCartTotals } from "@/features/cart/pricing";
import { useCartStore } from "@/features/cart/store";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { createOrder } from "./order-client";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя"),
  phone: z.string().trim().min(10, "Укажите корректный телефон"),
  email: z.union([z.literal(""), z.string().trim().email("Укажите корректный email")]),
  city: z.string().trim().min(2, "Укажите город"),
  address: z.string().trim().min(5, "Укажите адрес"),
  date: z.string().min(1, "Выберите дату"),
  interval: z.string().min(1, "Выберите интервал"),
  comment: z.string().trim().max(500, "Не более 500 символов").optional(),
  consent: z
    .boolean()
    .refine((isAccepted) => isAccepted, "Необходимо согласие на обработку данных"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const hydrated = useHydrated();
  const products = useCatalogStore((state) => state.products);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { interval: "", consent: false, email: "" },
  });

  if (!hydrated) {
    return <div className="h-[38rem] animate-pulse rounded-[1.75rem] bg-[#eee5e0]" aria-label="Загрузка оформления" />;
  }

  if (orderNumber !== null) {
    return (
      <div className="rounded-[1.75rem] border border-[#bdd8c8] bg-[#edf7f0] p-8">
        <p className="text-4xl" aria-hidden="true">✓</p>
        <h2 className="mt-4 text-2xl font-extrabold text-[#244532]">Заказ №{orderNumber} создан</h2>
        <p className="mt-3 leading-7 text-[#3f6a50]">
          Мы зафиксировали состав и актуальную стоимость: {formatMoney({ amountKopecks: confirmedTotal ?? 0, currency: "RUB" })}. Менеджер свяжется с вами, чтобы подтвердить время и детали доставки.
        </p>
        <Link href="/catalog" className="button-primary mt-6">Вернуться в каталог</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-[#d9c7cd] bg-white p-8 text-center">
        <h2 className="text-2xl font-extrabold text-[#342831]">В корзине пока нет товаров</h2>
        <p className="mt-3 text-[#776a72]">Добавьте композиции в корзину, чтобы перейти к оформлению.</p>
        <Link href="/catalog" className="button-primary mt-6">Открыть каталог</Link>
      </div>
    );
  }

  const totals = getCartTotals(items);

  async function submitOrder(values: CheckoutValues) {
    const unavailable = items.some((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return !getCartItemAvailability(product, item).available;
    });
    if (unavailable) {
      setSubmitError("В корзине есть недоступный товар. Вернитесь в корзину и удалите его.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const requestKey = idempotencyKey ?? crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(requestKey);
      const result = await createOrder(values, items, requestKey);
      setOrderNumber(result.order_number);
      setConfirmedTotal(result.total_kopecks);
      clearCart();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось создать заказ. Попробуйте ещё раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-6 rounded-[1.75rem] border border-[#e5dbd6] bg-white p-6 sm:p-8"
      onSubmit={handleSubmit(submitOrder)}
      noValidate
    >
      <div className="rounded-2xl bg-[#f8f2ee] p-4 text-sm leading-6 text-[#67555f]">
        Перед созданием заказа сервер повторно проверит товары, выбранные варианты, наличие и цену. Цена из браузера не используется.
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Имя" error={errors.name?.message}>
          <input {...register("name")} className="form-input" placeholder="Анна" autoComplete="name" />
        </Field>
        <Field label="Телефон" error={errors.phone?.message}>
          <input {...register("phone")} className="form-input" placeholder="+7 999 000-00-00" autoComplete="tel" />
        </Field>
        <Field label="Email (необязательно)" error={errors.email?.message}>
          <input {...register("email")} type="email" className="form-input" placeholder="name@example.ru" autoComplete="email" />
        </Field>
        <Field label="Город" error={errors.city?.message}>
          <input {...register("city")} className="form-input" placeholder="Москва" autoComplete="address-level2" />
        </Field>
        <Field label="Адрес" error={errors.address?.message}>
          <input {...register("address")} className="form-input" placeholder="Улица, дом, квартира" autoComplete="street-address" />
        </Field>
        <Field label="Желаемая дата" error={errors.date?.message}>
          <input {...register("date")} type="date" className="form-input" />
        </Field>
        <Field label="Интервал доставки" error={errors.interval?.message}>
          <select {...register("interval")} className="form-input">
            <option value="">Выберите время</option>
            <option value="09:00–12:00">09:00–12:00</option>
            <option value="12:00–15:00">12:00–15:00</option>
            <option value="15:00–18:00">15:00–18:00</option>
            <option value="18:00–21:00">18:00–21:00</option>
          </select>
        </Field>
      </div>
      <Field label="Комментарий к заказу" error={errors.comment?.message}>
        <textarea {...register("comment")} className="form-input min-h-28 resize-y" placeholder="Код домофона, пожелания к композиции…" />
      </Field>
      <div className="rounded-2xl border border-[#ebe1dc] p-4 text-sm text-[#67555f]">
        <div className="flex justify-between gap-4"><span>Товары</span><span>{formatMoney({ amountKopecks: totals.itemsTotalKopecks, currency: "RUB" })}</span></div>
        <div className="mt-2 flex justify-between gap-4"><span>Доставка</span><span>{formatMoney({ amountKopecks: totals.deliveryKopecks, currency: "RUB" })}</span></div>
        <div className="mt-3 flex justify-between border-t border-[#ebe1dc] pt-3 font-extrabold text-[#342831]"><span>Предварительный итог</span><span>{formatMoney({ amountKopecks: totals.totalKopecks, currency: "RUB" })}</span></div>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input {...register("consent")} type="checkbox" className="mt-1 size-4 rounded border-[#d1c4c9] accent-[#a42a4d]" />
        <span>
          Согласен на обработку данных для оформления заказа.
          {errors.consent ? <span className="block font-medium text-red-600">{errors.consent.message}</span> : null}
        </span>
      </label>
      {submitError ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="button-primary rounded-2xl disabled:cursor-wait disabled:opacity-70">
        {isSubmitting ? "Проверяем и создаём заказ…" : "Создать заказ"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#453740]">
      {label}
      {children}
      {error ? <span className="text-sm font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
