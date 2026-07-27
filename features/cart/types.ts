export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  selectedOptionLabels: string[];
  unitPriceKopecks: number;
  regularUnitPriceKopecks: number;
  productName: string;
  productSlug: string;
};

export type CartTotals = {
  itemsTotalKopecks: number;
  discountKopecks: number;
  deliveryKopecks: number;
  totalKopecks: number;
  deliveryIsFree: boolean;
};
