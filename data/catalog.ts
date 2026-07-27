export type Category = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  emoji: string;
  accent: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  priceKopecks: number;
  oldPriceKopecks?: number;
  emoji: string;
  accent: string;
  badge?: string;
  inStock: boolean;
  attributes: Array<{ label: string; value: string }>;
};

export const categories: Category[] = [
  {
    slug: "shary-s-geliem",
    name: "Воздушные шары с гелием",
    shortName: "Шары с гелием",
    description:
      "Однотонные, хромированные и прозрачные шары для любого повода.",
    emoji: "🎈",
    accent: "from-rose-100 to-orange-50",
  },
  {
    slug: "nabory",
    name: "Готовые наборы шаров",
    shortName: "Готовые наборы",
    description:
      "Сбалансированные композиции, которые легко выбрать и подарить.",
    emoji: "🎉",
    accent: "from-violet-100 to-fuchsia-50",
  },
  {
    slug: "detskie-prazdniki",
    name: "Шары для детского праздника",
    shortName: "Детский праздник",
    description:
      "Яркие герои, цифры и тематические наборы для маленьких именинников.",
    emoji: "⭐",
    accent: "from-sky-100 to-cyan-50",
  },
  {
    slug: "romantika",
    name: "Романтические композиции",
    shortName: "Романтика",
    description:
      "Сердца, нежные оттенки и эффектные большие композиции.",
    emoji: "💗",
    accent: "from-pink-100 to-rose-50",
  },
];

export const products: Product[] = [
  {
    id: "product-sunrise",
    slug: "nezhnyy-rassvet",
    name: "Нежный рассвет",
    shortDescription: "Фонтан из 15 шаров в пудровых оттенках",
    description:
      "Лёгкая композиция для дня рождения, свидания или сюрприза без повода. Шары подобраны в спокойной розово-персиковой гамме.",
    categorySlug: "nabory",
    priceKopecks: 549000,
    emoji: "🎈",
    accent: "from-rose-100 via-orange-50 to-amber-50",
    badge: "Хит",
    inStock: true,
    attributes: [
      { label: "Состав", value: "15 латексных шаров" },
      { label: "Высота", value: "до 1,8 м" },
      { label: "Время полёта", value: "от 3 дней" },
    ],
  },
  {
    id: "product-confetti",
    slug: "konfetti-prazdnik",
    name: "Конфетти-праздник",
    shortDescription: "Яркий набор из 9 шаров с конфетти",
    description:
      "Компактный праздничный набор с прозрачными шарами и цветным конфетти. Подойдёт для фотозоны или небольшого сюрприза.",
    categorySlug: "shary-s-geliem",
    priceKopecks: 329000,
    emoji: "🎉",
    accent: "from-yellow-100 via-pink-50 to-violet-100",
    inStock: true,
    attributes: [
      { label: "Состав", value: "9 шаров" },
      { label: "Конфетти", value: "бумажное, разноцветное" },
      { label: "Обработка", value: "Hi-Float включён" },
    ],
  },
  {
    id: "product-star",
    slug: "zvezdnyy-geroy",
    name: "Звёздный герой",
    shortDescription: "Тематический набор с большой фольгированной звездой",
    description:
      "Эффектный сине-серебряный набор для детского праздника. Большая звезда станет центром композиции и фотографий.",
    categorySlug: "detskie-prazdniki",
    priceKopecks: 479000,
    emoji: "⭐",
    accent: "from-sky-100 via-indigo-50 to-slate-100",
    badge: "Новинка",
    inStock: true,
    attributes: [
      { label: "Состав", value: "12 шаров и фольгированная звезда" },
      { label: "Палитра", value: "синий, серебро, белый" },
      { label: "Возраст", value: "от 3 лет" },
    ],
  },
  {
    id: "product-hearts",
    slug: "serdtsa-xxl",
    name: "Сердца XXL",
    shortDescription: "Большие фольгированные сердца и шары в тон",
    description:
      "Романтическая композиция для признания, годовщины или предложения. Сердца можно персонализировать короткой надписью.",
    categorySlug: "romantika",
    priceKopecks: 699000,
    oldPriceKopecks: 749000,
    emoji: "💗",
    accent: "from-pink-100 via-rose-50 to-red-100",
    inStock: true,
    attributes: [
      { label: "Состав", value: "3 сердца XXL и 10 шаров" },
      { label: "Надпись", value: "до 30 символов" },
      { label: "Высота", value: "до 2 м" },
    ],
  },
  {
    id: "product-cloud",
    slug: "rozovoe-oblako",
    name: "Розовое облако",
    shortDescription: "Большая воздушная композиция из 25 шаров",
    description:
      "Объёмная композиция для заметного поздравления или оформления комнаты. Разные размеры шаров создают эффект лёгкого облака.",
    categorySlug: "nabory",
    priceKopecks: 849000,
    emoji: "☁️",
    accent: "from-fuchsia-100 via-pink-50 to-white",
    inStock: true,
    attributes: [
      { label: "Состав", value: "25 шаров разного размера" },
      { label: "Палитра", value: "розовый, молочный, хром" },
      { label: "Подготовка", value: "около 90 минут" },
    ],
  },
  {
    id: "product-number",
    slug: "tsifra-s-fontanom",
    name: "Цифра с фонтаном",
    shortDescription: "Большая цифра и два фонтана из шаров",
    description:
      "Универсальный набор на день рождения. Выберите нужную цифру и палитру, а мы соберём композицию к указанному времени.",
    categorySlug: "detskie-prazdniki",
    priceKopecks: 579000,
    emoji: "1️⃣",
    accent: "from-amber-100 via-yellow-50 to-sky-100",
    inStock: true,
    attributes: [
      { label: "Состав", value: "цифра 102 см и 14 шаров" },
      { label: "Цифра", value: "от 0 до 9" },
      { label: "Цвет", value: "на выбор" },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}
