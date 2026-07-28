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

function appendMessage(url: string, message: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}text=${encodeURIComponent(message)}`;
}

export function telegramMessageHref(telegram: string, message: string) {
  return appendMessage(telegramHref(telegram), message);
}

export function whatsappMessageHref(whatsapp: string, message: string) {
  return appendMessage(whatsappHref(whatsapp), message);
}
