export type Money = {
  amountKopecks: number;
  currency: "RUB";
};

const rubleFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatMoney({ amountKopecks }: Money) {
  return rubleFormatter.format(amountKopecks / 100);
}

export function createMoney(amountKopecks: number): Money {
  if (!Number.isSafeInteger(amountKopecks) || amountKopecks < 0) {
    throw new Error("Сумма должна быть неотрицательным целым числом копеек.");
  }

  return {
    amountKopecks,
    currency: "RUB",
  };
}
