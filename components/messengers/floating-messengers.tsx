"use client";

import { MessengerButtons } from "./messenger-buttons";

export function FloatingMessengers() {
  return <div className="fixed bottom-4 right-4 z-30 max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6"><MessengerButtons compact message="Здравствуйте! Хочу уточнить детали заказа воздушных шаров." /></div>;
}
