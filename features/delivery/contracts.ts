import type { Money } from "@/lib/money";

export type DeliveryAddress = {
  region: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
};

export type DeliveryQuoteInput = {
  address: DeliveryAddress;
  desiredDeliveryAt?: string;
  orderItemsTotal: Money;
};

export type DeliveryQuote = {
  provider: string;
  serviceName: string;
  price: Money;
  estimatedDeliveryAt?: string;
};

export interface DeliveryProvider {
  getQuote(input: DeliveryQuoteInput): Promise<DeliveryQuote>;
}
