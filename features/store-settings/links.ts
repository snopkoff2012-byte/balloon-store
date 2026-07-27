export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function telegramHref(telegram: string) {
  const normalized = telegram.trim();
  if (!normalized) return "#contact";
  if (normalized.startsWith("https://") || normalized.startsWith("http://")) {
    return normalized;
  }
  return `https://t.me/${normalized.replace(/^@/, "")}`;
}

export function whatsappHref(whatsapp: string) {
  const normalized = whatsapp.trim();
  if (!normalized) return "#contact";
  if (normalized.startsWith("https://") || normalized.startsWith("http://")) {
    return normalized;
  }
  return `https://wa.me/${normalized.replace(/\D/g, "")}`;
}
