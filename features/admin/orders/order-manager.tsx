"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAdminData } from "@/features/admin/data/admin-data-provider";
import { saveOrder } from "@/features/admin/data/browser-repository";
import { orderUpdateSchema } from "@/features/admin/data/schemas";
import type { AdminOrder } from "@/features/admin/data/types";
import { formatMoney } from "@/lib/money";

type OrderFormValues = z.input<typeof orderUpdateSchema>;

const orderStatusLabels: Record<AdminOrder["status"], string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  preparing: "Готовится",
  handed_to_courier: "Передан курьеру",
  completed: "Завершён",
  cancelled: "Отменён",
};

const paymentStatusLabels: Record<AdminOrder["paymentStatus"], string> = {
  pending: "Не подтверждена",
  awaiting: "Ожидается",
  paid: "Оплачено",
  refunded: "Возврат",
  failed: "Ошибка",
};

const deliveryStatusLabels: Record<AdminOrder["deliveryStatus"], string> = {
  not_scheduled: "Не назначена",
  scheduled: "Назначена",
  courier_assigned: "Курьер назначен",
  in_transit: "В пути",
  delivered: "Доставлено",
  cancelled: "Отменена",
};

function valuesFromOrder(order: AdminOrder): OrderFormValues {
  return {
    status: order.status,
    managerComment: order.managerComment,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryStatus: order.deliveryStatus,
    deliveryZoneId: order.deliveryZoneId ?? "",
    requestedDeliveryDate: order.requestedDeliveryDate ?? "",
    requestedDeliverySlot: order.requestedDeliverySlot,
    deliveryRub:
      order.deliveryKopecks === null ? "" : order.deliveryKopecks / 100,
    urgentDelivery: order.urgentDelivery,
    deliveryRequiresConfirmation: order.deliveryRequiresConfirmation,
  };
}

export function OrderManager() {
  const { orders, deliveryZones, isLoading, updateSnapshot } = useAdminData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const selected =
    orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderUpdateSchema),
    values: selected ? valuesFromOrder(selected) : undefined,
  });

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery =
        !normalized ||
        `${order.orderNumber} ${order.customerName} ${order.customerPhone} ${order.customerEmail}`
          .toLocaleLowerCase("ru")
          .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  function selectOrder(order: AdminOrder) {
    setSelectedId(order.id);
    reset(valuesFromOrder(order));
    setNotice("");
  }

  async function onSubmit(values: OrderFormValues) {
    if (!selected) return;
    const parsed = orderUpdateSchema.parse(values);
    const updated: AdminOrder = {
      ...selected,
      status: parsed.status,
      managerComment: parsed.managerComment,
      paymentStatus: parsed.paymentStatus,
      paymentMethod: parsed.paymentMethod,
      deliveryStatus: parsed.deliveryStatus,
      deliveryZoneId: parsed.deliveryZoneId || null,
      requestedDeliveryDate: parsed.requestedDeliveryDate || null,
      requestedDeliverySlot: parsed.requestedDeliverySlot,
      deliveryKopecks:
        parsed.deliveryRub === ""
          ? null
          : Math.round(parsed.deliveryRub * 100),
      urgentDelivery: parsed.urgentDelivery,
      deliveryPricePending: parsed.deliveryRub === "",
      deliveryRequiresConfirmation: parsed.deliveryRequiresConfirmation,
      updatedAt: new Date().toISOString(),
    };
    updated.totalKopecks =
      updated.deliveryKopecks === null
        ? null
        : updated.itemsTotalKopecks -
          updated.discountKopecks +
          updated.deliveryKopecks;

    try {
      await saveOrder(updated);
      updateSnapshot((snapshot) => ({
        ...snapshot,
        orders: snapshot.orders.map((order) =>
          order.id === updated.id ? updated : order,
        ),
      }));
      setNoticeTone("success");
      setNotice("Заказ сохранён. Изменение статуса записано в историю.");
    } catch {
      setNoticeTone("error");
      setNotice("Не удалось сохранить заказ. Проверьте соединение и права.");
    }
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">
          {orders.length} заказов
        </p>
        <h1 className="mt-2 text-3xl font-black">Заказы</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Контакты клиента, состав заказа, доставка и оплата.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="admin-input"
          placeholder="Номер, имя, телефон или почта"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="admin-input"
          aria-label="Фильтр по статусу"
        >
          <option value="all">Все статусы</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <section aria-label="Список заказов" className="grid content-start gap-3">
          {filteredOrders.length ? (
            filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => selectOrder(order)}
                className={`w-full rounded-2xl border bg-white p-4 text-left transition ${
                  selected?.id === order.id
                    ? "border-rose-400 ring-2 ring-rose-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">Заказ №{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.customerName}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
                    {orderStatusLabels[order.status]}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                  <span className="font-bold">
                    {order.totalKopecks === null
                      ? "Уточняется"
                      : formatMoney({
                          amountKopecks: order.totalKopecks,
                          currency: "RUB",
                        })}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">
              Заказы по выбранным условиям не найдены.
            </p>
          )}
        </section>

        {selected ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-rose-600">
                  Заказ №{selected.orderNumber}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {selected.customerName}
                </h2>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {orderStatusLabels[selected.status]}
              </span>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <OrderSection title="Контакты клиента">
                <ContactLine label="Телефон" value={selected.customerPhone} />
                <ContactLine
                  label="Почта"
                  value={selected.customerEmail || "Не указана"}
                />
                <ContactLine
                  label="Комментарий"
                  value={selected.customerComment || "Нет комментария"}
                />
              </OrderSection>
              <OrderSection title="Доставка">
                <ContactLine
                  label="Зона"
                  value={
                    String(selected.deliveryZoneSnapshot.name ?? "") ||
                    deliveryZones.find(
                      (zone) => zone.id === selected.deliveryZoneId,
                    )?.name ||
                    "Не выбрана"
                  }
                />
                <ContactLine
                  label="Адрес"
                  value={formatAddress(selected.deliveryAddress)}
                />
                <ContactLine
                  label="Желаемая дата"
                  value={
                    selected.requestedDeliveryDate
                      ? new Date(
                          `${selected.requestedDeliveryDate}T00:00:00`,
                        ).toLocaleDateString("ru-RU")
                      : "Не указана"
                  }
                />
                <ContactLine
                  label="Интервал"
                  value={selected.requestedDeliverySlot || "Не указан"}
                />
                {selected.deliveryRequiresConfirmation ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Адрес или стоимость требуют подтверждения менеджера.
                  </p>
                ) : null}
              </OrderSection>
            </div>

            <OrderSection title="Товары" className="mt-5">
              {selected.items.length ? (
                selected.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
                  >
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.sku || "Без артикула"} · {item.quantity} шт.
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatMoney({
                        amountKopecks: item.lineTotalKopecks,
                        currency: "RUB",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Состав не найден.</p>
              )}
            </OrderSection>

            <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <AdminField label="Статус заказа">
                <select {...register("status")} className="admin-input">
                  {Object.entries(orderStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Статус оплаты">
                <select {...register("paymentStatus")} className="admin-input">
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Способ оплаты">
                <select {...register("paymentMethod")} className="admin-input">
                  <option value="on_confirmation">После подтверждения</option>
                  <option value="cash">Наличными</option>
                  <option value="card_to_courier">Картой курьеру</option>
                  <option value="online">Онлайн</option>
                </select>
              </AdminField>
              <AdminField label="Статус доставки">
                <select {...register("deliveryStatus")} className="admin-input">
                  {Object.entries(deliveryStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Зона доставки">
                <select {...register("deliveryZoneId")} className="admin-input">
                  <option value="">Не выбрана</option>
                  {deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Стоимость доставки, ₽">
                <input
                  type="number"
                  min="0"
                  {...register("deliveryRub")}
                  className="admin-input"
                />
              </AdminField>
              <AdminField label="Дата доставки">
                <input
                  type="date"
                  {...register("requestedDeliveryDate")}
                  className="admin-input"
                />
              </AdminField>
              <AdminField label="Интервал">
                <input
                  {...register("requestedDeliverySlot")}
                  className="admin-input"
                />
              </AdminField>
            </div>
            <label className="admin-check mt-4 w-fit">
              <input type="checkbox" {...register("urgentDelivery")} />
              Срочная доставка
            </label>
            <label className="admin-check mt-3 w-fit">
              <input
                type="checkbox"
                {...register("deliveryRequiresConfirmation")}
              />
              Адрес или стоимость ещё требуют подтверждения
            </label>
            <AdminField label="Комментарий менеджера" className="mt-4">
              <textarea
                {...register("managerComment")}
                className="admin-input min-h-24"
                placeholder="Внутренний комментарий, покупатель его не видит"
              />
            </AdminField>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
              <MoneyLine label="Товары" value={selected.itemsTotalKopecks} />
              <MoneyLine label="Скидка" value={-selected.discountKopecks} />
              <MoneyLine
                label="Доставка"
                value={selected.deliveryKopecks}
                fallback="Уточняется"
              />
              <MoneyLine
                label="Итого"
                value={selected.totalKopecks}
                fallback="Уточняется"
                strong
              />
            </div>

            {notice ? (
              <p
                role={noticeTone === "error" ? "alert" : "status"}
                className={`mt-5 rounded-xl p-3 text-sm font-semibold ${
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
              className="admin-primary mt-5 w-full sm:w-auto"
            >
              {isSubmitting ? "Сохраняем…" : "Сохранить заказ"}
            </button>
          </form>
        ) : (
          <p className="rounded-3xl bg-white p-8 text-center text-slate-500">
            Заказов пока нет.
          </p>
        )}
      </div>
    </div>
  );
}

function formatAddress(address: Record<string, unknown>) {
  const parts = [
    address.city,
    address.street,
    address.house ? `д. ${address.house}` : "",
    address.apartment ? `кв. ${address.apartment}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Не указан";
}

function OrderSection({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-slate-50 p-4 ${className}`}>
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-6">
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}

function AdminField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function MoneyLine({
  label,
  value,
  fallback,
  strong = false,
}: {
  label: string;
  value: number | null;
  fallback?: string;
  strong?: boolean;
}) {
  return (
    <p
      className={`flex items-center justify-between gap-3 py-1 ${
        strong ? "mt-2 border-t border-slate-200 pt-3 text-base font-black" : ""
      }`}
    >
      <span>{label}</span>
      <span>
        {value === null
          ? fallback
          : formatMoney({ amountKopecks: value, currency: "RUB" })}
      </span>
    </p>
  );
}
