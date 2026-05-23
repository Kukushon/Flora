const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'flora.db');

let db;

function getDb() {
  if (!db) db = new DatabaseSync(DB_PATH);
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      category      TEXT    NOT NULL,
      categoryLabel TEXT    NOT NULL,
      price         INTEGER NOT NULL,
      emoji         TEXT    NOT NULL,
      description   TEXT,
      badge         TEXT,
      inStock       INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      recipientName   TEXT    NOT NULL,
      recipientPhone  TEXT    NOT NULL,
      cardMessage     TEXT,
      address         TEXT    NOT NULL,
      deliveryDate    TEXT    NOT NULL,
      timeSlot        TEXT    NOT NULL,
      deliveryType    TEXT    NOT NULL,
      paymentMethod   TEXT    NOT NULL,
      total           INTEGER NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'new',
      createdAt       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId   INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      price     INTEGER NOT NULL,
      qty       INTEGER NOT NULL
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as n FROM products').get();
  if (count.n === 0) {
    seedProducts(db);
    console.log('🌱 База данных заполнена начальными товарами');
  }

  console.log('🗄️  База данных инициализирована');
}

function seedProducts(db) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, categoryLabel, price, emoji, description, badge, inStock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Нежность пиона',     'bouquet', 'Букет',      3200, '🌸', '15 пионов нежно-розовых оттенков',     'Хит',         1],
    ['Солнечный день',     'mono',    'Монобукет',  1800, '🌻', '25 подсолнухов с зеленью',             null,          1],
    ['Алый бархат',        'bouquet', 'Букет',      4500, '🌹', '21 роза сорта Ред Наоми',              'Новинка',     1],
    ['Лавандовый сон',     'mono',    'Монобукет',  2100, '💜', 'Лаванда и эвкалипт, 50 стеблей',       null,          1],
    ['Монстера Делициоза', 'plant',   'Растение',   2800, '🌿', 'В горшке 14 см, высота 40 см',          null,          1],
    ['Корзина любви',      'gift',    'Подарочная', 6500, '🧺', 'Цветы + конфеты Raffaello + открытка', 'Топ подарок', 1],
    ['Белая дымка',        'bouquet', 'Букет',      3800, '🤍', 'Белые тюльпаны и гипсофила',           null,          1],
    ['Орхидея Фаленопсис', 'plant',   'Растение',   3500, '🌺', 'Белая, 2 ветки, в горшке 12 см',       null,          1],
  ];

  products.forEach(p => insert.run(...p));
}

module.exports = { getDb, initDb };
