const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter  = require('./routes/orders');
const { initDb }    = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));          // разрешаем запросы с фронта
app.use(express.json());

// ── Отдаём статику фронта (html/css/js) ──────────────────────────────────
// Папка frontend должна находиться рядом с папкой backend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API маршруты ──────────────────────────────────────────────────────────
app.use('/api/products', productsRouter);
app.use('/api/orders',   ordersRouter);

// ── Запуск ────────────────────────────────────────────────────────────────
initDb();   // создаём таблицы при первом старте

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`📦 API товаров:    http://localhost:${PORT}/api/products`);
  console.log(`📋 API заказов:    http://localhost:${PORT}/api/orders`);
});
