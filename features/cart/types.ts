export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  selectedOptions: Record<string, unknown>;
};
