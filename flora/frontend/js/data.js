// ── Данные о товарах ─────────────────────────────────────────────────────
// Позже эти данные будут приходить с бэкенда через API
// Пока используем "заглушку" (mock data)

const PRODUCTS = [
  {
    id: 1,
    name: "Нежность пиона",
    category: "bouquet",
    categoryLabel: "Букет",
    price: 3200,
    emoji: "🌸",
    desc: "15 пионов нежно-розовых оттенков",
    badge: "Хит",
    inStock: true
  },
  {
    id: 2,
    name: "Солнечный день",
    category: "mono",
    categoryLabel: "Монобукет",
    price: 1800,
    emoji: "🌻",
    desc: "25 подсолнухов с зеленью",
    badge: null,
    inStock: true
  },
  {
    id: 3,
    name: "Алый бархат",
    category: "bouquet",
    categoryLabel: "Букет",
    price: 4500,
    emoji: "🌹",
    desc: "21 роза сорта Ред Наоми",
    badge: "Новинка",
    inStock: true
  },
  {
    id: 4,
    name: "Лавандовый сон",
    category: "mono",
    categoryLabel: "Монобукет",
    price: 2100,
    emoji: "💜",
    desc: "Лаванда и эвкалипт, 50 стеблей",
    badge: null,
    inStock: true
  },
  {
    id: 5,
    name: "Монстера Делициоза",
    category: "plant",
    categoryLabel: "Растение",
    price: 2800,
    emoji: "🌿",
    desc: "В горшке 14 см, высота 40 см",
    badge: null,
    inStock: true
  },
  {
    id: 6,
    name: "Корзина любви",
    category: "gift",
    categoryLabel: "Подарочная",
    price: 6500,
    emoji: "🧺",
    desc: "Цветы + конфеты Raffaello + открытка",
    badge: "Топ подарок",
    inStock: true
  },
  {
    id: 7,
    name: "Белая дымка",
    category: "bouquet",
    categoryLabel: "Букет",
    price: 3800,
    emoji: "🤍",
    desc: "Белые тюльпаны и гипсофила",
    badge: null,
    inStock: true
  },
  {
    id: 8,
    name: "Орхидея Фаленопсис",
    category: "plant",
    categoryLabel: "Растение",
    price: 3500,
    emoji: "🌺",
    desc: "Белая, 2 ветки, в горшке 12 см",
    badge: null,
    inStock: true
  }
];
