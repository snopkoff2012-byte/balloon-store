"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (current) => current.variantId === item.variantId,
          );

          if (existingItem) {
            return {
              items: state.items.map((current) =>
                current.variantId === item.variantId
                  ? {
                      ...current,
                      quantity: current.quantity + item.quantity,
                    }
                  : current,
              ),
            };
          }

          return { items: [...state.items, item] };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId
                    ? { ...item, quantity }
                    : item,
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "balloon-store-cart",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as CartStore;
        if (version < 3) {
          return {
            ...state,
            items: state.items.map((item) => ({
              ...item,
              regularUnitPriceKopecks:
                item.regularUnitPriceKopecks ?? item.unitPriceKopecks,
            })),
          };
        }
        return state;
      },
    },
  ),
);
