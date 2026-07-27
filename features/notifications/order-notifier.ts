export type NewOrderNotification = {
  orderNumber: number;
  totalKopecks: number;
  fulfillmentMethod: "delivery" | "pickup";
};

export interface OrderNotifier {
  notifyNewOrder(order: NewOrderNotification): Promise<void>;
}

// Точка подключения Telegram, email или CRM. В первой версии не отправляем
// персональные данные во внешние сервисы и не делаем оформление зависимым от них.
const noopOrderNotifier: OrderNotifier = {
  async notifyNewOrder() {},
};

export function getOrderNotifier(): OrderNotifier {
  return noopOrderNotifier;
}
