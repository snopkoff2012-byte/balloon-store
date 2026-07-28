"use client";

import { telegramMessageHref, whatsappMessageHref } from "@/features/store-settings/links";
import { useStoreSettings } from "@/features/store-settings/store";

type MessengerButtonsProps = {
  message: string;
  className?: string;
  compact?: boolean;
};

export function MessengerButtons({ message, className = "", compact = false }: MessengerButtonsProps) {
  const settings = useStoreSettings();
  const buttons = [
    settings.telegramEnabled && settings.telegram.trim()
      ? { name: "Telegram", href: telegramMessageHref(settings.telegram, message), tone: "bg-[#229ED9]" }
      : null,
    settings.whatsappEnabled && settings.whatsapp.trim()
      ? { name: "WhatsApp", href: whatsappMessageHref(settings.whatsapp, message), tone: "bg-[#25D366]" }
      : null,
  ].filter(Boolean) as Array<{ name: string; href: string; tone: string }>;

  if (!buttons.length) return null;
  return <div className={`flex flex-wrap gap-2 ${className}`}>
    {buttons.map((button) => <a key={button.name} href={button.href} target="_blank" rel="noreferrer" className={`${button.tone} inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98] ${compact ? "min-w-11 px-3" : "flex-1"}`} aria-label={`Написать в ${button.name}`}><span aria-hidden="true">{button.name === "Telegram" ? "✈" : "◔"}</span><span className="ml-2">{compact ? button.name : `Написать в ${button.name}`}</span></a>)}
  </div>;
}
