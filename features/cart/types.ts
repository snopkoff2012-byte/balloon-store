export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  selectedOptionLabels: string[];
  unitPriceKopecks: number;
  productName: string;
  productSlug: string;
};
