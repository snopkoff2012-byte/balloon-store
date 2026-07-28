import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createOrderSchema, orderResultSchema } from "@/features/checkout/order-schema";
import { getOrderNotifier } from "@/features/notifications/order-notifier";
import { getOptionalPublicEnvironment } from "@/lib/environment";

export async function POST(request: Request) {
  const environment = getOptionalPublicEnvironment();
  if (!environment) {
    return NextResponse.json(
      { error: "Оформление заказа временно недоступно. Попробуйте позже." },
      { status: 503 },
    );
  }

  const payload = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Проверьте данные заказа и состав корзины." },
      { status: 400 },
    );
  }

  const supabase = createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const { data, error } = await supabase.rpc("create_public_order", {
    order_input: {
      customer_name: payload.data.name,
      customer_phone: payload.data.phone,
      contact_method: payload.data.contactMethod,
      customer_email: payload.data.email || null,
      recipient_is_different: payload.data.recipientIsDifferent,
      recipient_name: payload.data.recipientName || null,
      recipient_phone: payload.data.recipientPhone || null,
      city: payload.data.city,
      address: payload.data.address,
      apartment_office: payload.data.apartmentOffice,
      entrance: payload.data.entrance,
      floor: payload.data.floor,
      intercom: payload.data.intercom,
      requested_delivery_date: payload.data.date,
      requested_delivery_slot: payload.data.interval,
      comment: payload.data.comment,
      card_enabled: payload.data.cardEnabled,
      card_text: payload.data.cardText,
      fulfillment_method: payload.data.fulfillmentMethod,
      delivery_zone_id: payload.data.deliveryZoneId,
      urgent_delivery: payload.data.urgentDelivery,
      payment_method: payload.data.paymentMethod,
      website: payload.data.website,
      submitted_at: payload.data.submittedAt,
      idempotency_key: payload.data.idempotencyKey,
      items: payload.data.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        selected_options: item.selectedOptions,
      })),
    },
  });

  if (error) {
    const status = error.message.includes("CART_") ? 409 : 500;
    const deliveryError = error.message.includes("CART_DELIVERY");
    return NextResponse.json(
      {
        error:
          status === 409
            ? deliveryError
              ? "Тариф или зона доставки изменились. Выберите зону и временной интервал ещё раз."
              : "Состав корзины изменился: проверьте наличие и цену товара."
            : "Не удалось создать заказ. Попробуйте ещё раз или напишите менеджеру.",
      },
      { status },
    );
  }

  const result = orderResultSchema.safeParse(Array.isArray(data) ? data[0] : data);
  if (!result.success) {
    return NextResponse.json(
      { error: "Не удалось подтвердить состав заказа. Попробуйте ещё раз." },
      { status: 500 },
    );
  }

  // Уведомление не влияет на факт оформления: провайдер можно подключить
  // позднее, не раскрывая контактные данные клиента внешнему сервису.
  void getOrderNotifier()
    .notifyNewOrder({
      orderNumber: result.data.order_number,
      totalKopecks: result.data.total_kopecks,
      fulfillmentMethod: payload.data.fulfillmentMethod,
    })
    .catch(() => undefined);

  return NextResponse.json(result.data, { status: 201 });
}
