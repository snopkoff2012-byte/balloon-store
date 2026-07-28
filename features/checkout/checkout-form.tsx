"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { useCatalogStore } from "@/features/catalog/store";
import { getCartItemAvailability } from "@/features/cart/availability";
import { getCartTotals } from "@/features/cart/pricing";
import { useCartStore } from "@/features/cart/store";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { useStoreSettings } from "@/features/store-settings/store";
import type { DeliveryZone } from "@/features/delivery/types";
import {
  calculateDeliveryEstimate,
  deliveryZoneTypeLabels,
  findDeliveryZoneForCity,
  normalizeDeliveryLocation,
} from "@/features/delivery/zone-utils";
import {
  getAvailableDeliverySlots,
  getEarliestDeliveryDate,
  isAvailableDeliverySlot,
} from "./delivery";
import { createOrder } from "./order-client";
import { checkoutDetailsSchema, type CheckoutDetails } from "./order-schema";
import { PhoneInput } from "./phone-input";

const defaultValues: CheckoutDetails = {
  name: "",
  phone: "",
  contactMethod: "telegram",
  email: "",
  recipientIsDifferent: false,
  recipientName: "",
  recipientPhone: "",
  comment: "",
  cardEnabled: false,
  cardText: "",
  fulfillmentMethod: "delivery",
  deliveryZoneId: "",
  city: "Москва",
  address: "",
  apartmentOffice: "",
  entrance: "",
  floor: "",
  intercom: "",
  date: getEarliestDeliveryDate(),
  interval: "",
  urgentDelivery: false,
  paymentMethod: "on_confirmation",
  consent: false,
  website: "",
  submittedAt: Date.now(),
};

export function CheckoutForm({
  deliveryZones,
  deliveryZonesUnavailable = false,
}: {
  deliveryZones: DeliveryZone[];
  deliveryZonesUnavailable?: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const products = useCatalogStore((state) => state.products);
  const settings = useStoreSettings();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues,
  });
  const fulfillmentMethod = useWatch({ control, name: "fulfillmentMethod" });
  const deliveryZoneId = useWatch({ control, name: "deliveryZoneId" });
  const city = useWatch({ control, name: "city" });
  const recipientIsDifferent = useWatch({ control, name: "recipientIsDifferent" });
  const cardEnabled = useWatch({ control, name: "cardEnabled" });
  const date = useWatch({ control, name: "date" });
  const interval = useWatch({ control, name: "interval" });
  const urgentDelivery = useWatch({ control, name: "urgentDelivery" });
  const selectedZone =
    deliveryZones.find((zone) => zone.id === deliveryZoneId) ?? null;
  const pickupZone =
    deliveryZones.find((zone) => zone.zoneType === "pickup") ?? null;
  const availableSlots = useMemo(
    () =>
      getAvailableDeliverySlots(
        date,
        selectedZone?.deliveryIntervals ?? [],
      ),
    [date, selectedZone],
  );
  const totals = getCartTotals(items);
  const delivery = calculateDeliveryEstimate({
    zone: selectedZone,
    itemsTotalKopecks: totals.itemsTotalKopecks,
    urgentDelivery,
  });

  useEffect(() => {
    if (interval && !availableSlots.some((slot) => slot.value === interval)) {
      setValue("interval", "", { shouldValidate: true });
    }
  }, [availableSlots, interval, setValue]);

  useEffect(() => {
    if (fulfillmentMethod === "pickup") {
      if (pickupZone && deliveryZoneId !== pickupZone.id) {
        setValue("deliveryZoneId", pickupZone.id, { shouldValidate: true });
      }
      if (urgentDelivery) setValue("urgentDelivery", false);
      return;
    }

    if (selectedZone?.zoneType === "pickup") {
      setValue("deliveryZoneId", "", { shouldValidate: true });
    }
  }, [
    deliveryZoneId,
    fulfillmentMethod,
    pickupZone,
    selectedZone,
    setValue,
    urgentDelivery,
  ]);

  useEffect(() => {
    if (urgentDelivery && !selectedZone?.urgentDeliveryAvailable) {
      setValue("urgentDelivery", false);
    }
  }, [selectedZone, setValue, urgentDelivery]);

  useEffect(() => {
    if (fulfillmentMethod !== "delivery" || city.trim().length < 3) return;
    const matchedZone = findDeliveryZoneForCity(city, deliveryZones);
    if (matchedZone && matchedZone.id !== deliveryZoneId) {
      setValue("deliveryZoneId", matchedZone.id, { shouldValidate: true });
      clearErrors("deliveryZoneId");
    }
  }, [
    city,
    clearErrors,
    deliveryZoneId,
    deliveryZones,
    fulfillmentMethod,
    setValue,
  ]);

  if (!hydrated) {
    return <div className="h-[46rem] animate-pulse rounded-[1.75rem] bg-[#eee5e0]" aria-label="Загрузка оформления" />;
  }

  if (!items.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-[#d9c7cd] bg-white p-8 text-center">
        <h2 className="text-2xl font-extrabold text-[#342831]">В корзине пока нет товаров</h2>
        <p className="mt-3 text-[#776a72]">Добавьте композиции в корзину, чтобы перейти к оформлению.</p>
        <Link href="/catalog" className="button-primary mt-6">Открыть каталог</Link>
      </div>
    );
  }

  async function submitOrder(values: CheckoutDetails) {
    if (isSubmitting) return;
    const unavailable = items.some((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return !getCartItemAvailability(product, item).available;
    });
    if (unavailable) {
      setSubmitError("В корзине есть недоступный товар. Вернитесь в корзину и удалите его.");
      return;
    }

    if (totals.itemsTotalKopecks < settings.minimumOrderRub * 100) {
      setSubmitError(
        `Минимальная сумма заказа — ${formatMoney({ amountKopecks: settings.minimumOrderRub * 100, currency: "RUB" })}.`,
      );
      return;
    }

    const currentZone =
      deliveryZones.find((zone) => zone.id === values.deliveryZoneId) ?? null;
    if (!currentZone || !currentZone.isActive) {
      setError("deliveryZoneId", {
        type: "validate",
        message: "Выберите доступную зону доставки",
      });
      return;
    }
    if (
      (values.fulfillmentMethod === "pickup") !==
      (currentZone.zoneType === "pickup")
    ) {
      setError("deliveryZoneId", {
        type: "validate",
        message: "Зона не соответствует способу получения",
      });
      return;
    }
    if (totals.itemsTotalKopecks < currentZone.minimumOrderKopecks) {
      setSubmitError(
        `Для зоны «${currentZone.name}» минимальная сумма заказа — ${formatMoney({
          amountKopecks: currentZone.minimumOrderKopecks,
          currency: "RUB",
        })}.`,
      );
      return;
    }
    if (
      !isAvailableDeliverySlot(
        values.date,
        values.interval,
        currentZone.deliveryIntervals,
      )
    ) {
      setError("interval", {
        type: "validate",
        message: "Этот интервал уже недоступен",
      });
      return;
    }
    if (values.urgentDelivery && !currentZone.urgentDeliveryAvailable) {
      setError("urgentDelivery", {
        type: "validate",
        message: "В этой зоне срочная доставка недоступна",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const requestKey = idempotencyKey ?? crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(requestKey);
      const result = await createOrder(values, items, requestKey);
      clearCart();
      router.replace(
        `/order/${result.public_token}/success?number=${result.order_number}&total=${result.total_kopecks}&deliveryPending=${result.delivery_price_pending ? "1" : "0"}`,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось создать заказ. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6 rounded-[1.75rem] border border-[#e5dbd6] bg-white p-5 sm:p-8" onSubmit={handleSubmit(submitOrder)} noValidate>
      <p className="rounded-2xl bg-[#f8f2ee] p-4 text-sm leading-6 text-[#67555f]">
        Перед созданием заказа сервер заново проверит товары, варианты, наличие и цену. Данные банковской карты здесь не запрашиваются и не хранятся.
      </p>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="text-lg font-extrabold text-[#342831]">Ваши контакты</legend>
        <Field label="Имя" error={errors.name?.message}><input {...register("name")} className="form-input" autoComplete="name" placeholder="Анна" /></Field>
        <Field label="Телефон" error={errors.phone?.message}><PhoneInput control={control} name="phone" /></Field>
        <Field label="Как с вами связаться" error={errors.contactMethod?.message}>
          <select {...register("contactMethod")} className="form-input"><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option></select>
        </Field>
        <Field label="Email (необязательно)" error={errors.email?.message}><input {...register("email")} type="email" className="form-input" autoComplete="email" placeholder="name@example.ru" /></Field>
      </fieldset>

      <fieldset className="grid gap-4 border-t border-[#eee5e0] pt-6">
        <legend className="text-lg font-extrabold text-[#342831]">Получатель и открытка</legend>
        <Check label="Получатель отличается от заказчика" input={register("recipientIsDifferent")} />
        {recipientIsDifferent ? <div className="grid gap-5 sm:grid-cols-2"><Field label="Имя получателя" error={errors.recipientName?.message}><input {...register("recipientName")} className="form-input" /></Field><Field label="Телефон получателя" error={errors.recipientPhone?.message}><PhoneInput control={control} name="recipientPhone" /></Field></div> : null}
        <Check label="Добавить открытку к композиции" input={register("cardEnabled")} />
        {cardEnabled ? <Field label="Текст открытки" error={errors.cardText?.message}><textarea {...register("cardText")} className="form-input min-h-24 resize-y" maxLength={300} placeholder="С днём рождения!" /></Field> : null}
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[#eee5e0] pt-6">
        <legend className="text-lg font-extrabold text-[#342831]">Получение заказа</legend>
        <div className="grid grid-cols-2 gap-3">
          <Choice label="Доставка" value="delivery" checked={fulfillmentMethod === "delivery"} input={register("fulfillmentMethod")} />
          <Choice label="Самовывоз" value="pickup" checked={fulfillmentMethod === "pickup"} input={register("fulfillmentMethod")} />
        </div>
        {deliveryZonesUnavailable ? (
          <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Не удалось загрузить тарифы доставки. Обновите страницу или свяжитесь с менеджером — заказ с неподтверждённой стоимостью не отправится.
          </p>
        ) : null}
        {fulfillmentMethod === "delivery" ? (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Город" error={errors.city?.message}>
                <input
                  {...register("city")}
                  className="form-input"
                  autoComplete="address-level2"
                  placeholder="Москва или город области"
                />
              </Field>
              <Field
                label="Округ Москвы или город области"
                error={errors.deliveryZoneId?.message}
              >
                <select
                  {...register("deliveryZoneId")}
                  className="form-input"
                  onChange={(event) => {
                    setValue("deliveryZoneId", event.target.value, {
                      shouldValidate: true,
                    });
                    const zone = deliveryZones.find(
                      (candidate) => candidate.id === event.target.value,
                    );
                    if (zone?.zoneType === "region_city") {
                      setValue("city", zone.name, { shouldValidate: true });
                    }
                  }}
                >
                  <option value="">Выберите зону</option>
                  {(["moscow_district", "region_city", "individual"] as const).map(
                    (type) => {
                      const zones = deliveryZones.filter(
                        (zone) => zone.zoneType === type,
                      );
                      return zones.length ? (
                        <optgroup
                          key={type}
                          label={deliveryZoneTypeLabels[type]}
                        >
                          {zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null;
                    },
                  )}
                </select>
              </Field>
            </div>
            {city &&
            normalizeDeliveryLocation(city) !== "москва" &&
            selectedZone?.zoneType === "individual" ? (
              <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                Город не найден в списке управляемых тарифов. Выбрана зона «Индивидуальный расчёт»: стоимость уточнит менеджер.
              </p>
            ) : null}
            {selectedZone ? (
              <div className="rounded-2xl border border-[#e8ddd8] bg-[#faf6f3] p-4 text-sm leading-6 text-[#67555f]">
                <b className="text-[#453740]">{selectedZone.name}.</b>{" "}
                {selectedZone.description}
                {delivery.pricePending ? (
                  <span className="mt-2 block font-bold text-amber-800">
                    Стоимость уточнит менеджер.
                  </span>
                ) : null}
                {delivery.requiresManagerConfirmation ? (
                  <span className="mt-2 block">
                    Адрес и итоговый тариф будут подтверждены вручную перед сборкой заказа.
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#f8f2ee] p-4 text-sm leading-6 text-[#67555f]">
                Для Москвы выберите административный округ. Для города области зона подберётся по названию; если города нет в списке, включится индивидуальный расчёт.
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Адрес" error={errors.address?.message}><input {...register("address")} className="form-input" autoComplete="street-address" placeholder="Улица, дом" /></Field>
              <Field label="Квартира или офис" error={errors.apartmentOffice?.message}><input {...register("apartmentOffice")} className="form-input" /></Field>
              <Field label="Подъезд" error={errors.entrance?.message}><input {...register("entrance")} className="form-input" /></Field>
              <Field label="Этаж" error={errors.floor?.message}><input {...register("floor")} className="form-input" /></Field>
              <Field label="Домофон" error={errors.intercom?.message}><input {...register("intercom")} className="form-input" /></Field>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#edf7f0] p-4 text-sm leading-6 text-[#3f6a50]">
            <b>Самовывоз — бесплатно.</b>{" "}
            {pickupZone?.description ??
              "Менеджер подтвердит адрес и готовность заказа."}
            {errors.deliveryZoneId ? (
              <span className="mt-2 block font-semibold text-red-700">
                Самовывоз сейчас недоступен. Выберите доставку или обратитесь к менеджеру.
              </span>
            ) : null}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Дата" error={errors.date?.message}><input {...register("date")} type="date" min={getEarliestDeliveryDate()} className="form-input" /></Field><Field label="Временной интервал" error={errors.interval?.message}><select {...register("interval")} className="form-input"><option value="">Выберите время</option>{availableSlots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></Field></div>
        {fulfillmentMethod === "delivery" && selectedZone?.urgentDeliveryAvailable ? (
          <Check
            label={`Срочная доставка (+${formatMoney({
              amountKopecks: selectedZone.urgentSurchargeKopecks,
              currency: "RUB",
            })})`}
            input={register("urgentDelivery")}
          />
        ) : fulfillmentMethod === "delivery" && selectedZone ? (
          <p className="text-sm text-[#776a72]">
            Для этой зоны срочная доставка недоступна.
          </p>
        ) : null}
        {errors.urgentDelivery ? (
          <p className="text-sm text-red-600">
            {errors.urgentDelivery.message}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[#eee5e0] pt-6">
        <legend className="text-lg font-extrabold text-[#342831]">Оплата и комментарий</legend>
        <Field label="Способ оплаты" error={errors.paymentMethod?.message}><select {...register("paymentMethod")} className="form-input"><option value="on_confirmation">После подтверждения менеджером</option><option value="cash">Наличными</option><option value="card_to_courier">Картой курьеру</option><option value="online">Онлайн после подтверждения</option></select></Field>
        <Field label="Комментарий к заказу" error={errors.comment?.message}><textarea {...register("comment")} className="form-input min-h-24 resize-y" placeholder="Пожелания к композиции или доставке" /></Field>
      </fieldset>

      <div className="rounded-2xl border border-[#ebe1dc] p-4 text-sm text-[#67555f]" aria-live="polite">
        <MoneyLine label="Товары" value={totals.itemsTotalKopecks} />
        {totals.discountKopecks > 0 ? <MoneyLine label="Скидка" value={-totals.discountKopecks} /> : null}
        {delivery.deliveryKopecks === null ? (
          <TextLine label="Доставка" value="Стоимость уточнит менеджер" />
        ) : (
          <MoneyLine
            label={
              delivery.deliveryIsFree ? "Доставка (бесплатно)" : "Доставка"
            }
            value={delivery.deliveryKopecks}
          />
        )}
        <div className="mt-3 flex justify-between gap-4 border-t border-[#ebe1dc] pt-3 text-base font-extrabold text-[#342831]">
          <span>{delivery.totalKopecks === null ? "Товары без доставки" : "Предварительный итог"}</span>
          <span>
            {formatMoney({
              amountKopecks:
                delivery.totalKopecks ?? totals.itemsTotalKopecks,
              currency: "RUB",
            })}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5">Точная стоимость и доступность подтверждаются сервером при создании заказа.</p>
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input {...register("consent")} type="checkbox" className="mt-1 size-4 rounded border-[#d1c4c9] accent-[#a42a4d]" /><span>Согласен на обработку персональных данных для оформления заказа.{errors.consent ? <span className="block font-medium text-red-600">Необходимо согласие</span> : null}</span></label>
      <input {...register("website")} className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {submitError ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="button-primary rounded-2xl disabled:cursor-wait disabled:opacity-70">{isSubmitting ? "Проверяем и создаём заказ…" : "Создать заказ"}</button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold text-[#453740]">{label}{children}{error ? <span className="text-sm font-normal text-red-600">{error}</span> : null}</label>; }
function Check({ label, input }: { label: string; input: UseFormRegisterReturn }) { return <label className="flex items-center gap-3 text-sm font-semibold text-[#453740]"><input type="checkbox" className="size-4 accent-[#a42a4d]" {...input} />{label}</label>; }
function Choice({ label, value, checked, input }: { label: string; value: "delivery" | "pickup"; checked: boolean; input: UseFormRegisterReturn }) { return <label className={`cursor-pointer rounded-2xl border p-4 text-sm font-bold transition ${checked ? "border-[#a42a4d] bg-[#fff4f6] text-[#8e1638]" : "border-[#e5dbd6] text-[#67555f]"}`}><input type="radio" value={value} className="sr-only" {...input} />{label}</label>; }
function MoneyLine({ label, value }: { label: string; value: number }) { return <div className="flex justify-between gap-4"><span>{label}</span><span>{value < 0 ? "−" : ""}{formatMoney({ amountKopecks: Math.abs(value), currency: "RUB" })}</span></div>; }
function TextLine({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span>{label}</span><span className="text-right font-semibold text-amber-800">{value}</span></div>; }
