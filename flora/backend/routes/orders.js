const express = require('express');
const router  = express.Router();
const { getDb } = require('../db/database');

// ── POST /api/orders ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const db = getDb();

  const { recipient, delivery, payment, items, total } = req.body;

  // Валидация
  const errors = [];
  if (!recipient?.name)            errors.push('Укажите имя получателя');
  if (!recipient?.phone)           errors.push('Укажите телефон');
  if (!delivery?.address)          errors.push('Укажите адрес доставки');
  if (!delivery?.date)             errors.push('Укажите дату доставки');
  if (!items || items.length === 0) errors.push('Корзина пуста');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // Вставляем заказ (позиционные параметры ?, совместимы с node:sqlite)
    const insertOrder = db.prepare(`
      INSERT INTO orders
        (recipientName, recipientPhone, cardMessage, address, deliveryDate,
         timeSlot, deliveryType, paymentMethod, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertOrder.run(
      recipient.name,
      recipient.phone,
      recipient.cardMessage || '',
      delivery.address,
      delivery.date,
      delivery.timeSlot,
      delivery.type || 'standard',
      payment || 'card',
      total
    );

    const orderId = result.lastInsertRowid;

    // Вставляем позиции заказа
    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, name, price, qty)
      VALUES (?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      let productName = `Товар #${item.productId}`;
      try {
        const product = db.prepare('SELECT name FROM products WHERE id = ?').get(item.productId);
        if (product) productName = product.name;
      } catch (e) { /* не критично */ }

      insertItem.run(orderId, item.productId, productName, item.price, item.qty);
    });

    console.log(`📦 Новый заказ #${orderId} от ${recipient.name} (${recipient.phone})`);

    res.status(201).json({
      success: true,
      data: {
        orderId,
        message: 'Заказ принят! Менеджер позвонит в течение 15 минут.'
      }
    });

  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера при создании заказа' });
  }
});

// ── GET /api/orders ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();

    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id);
      return { ...order, items };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Ошибка получения заказов:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ── GET /api/orders/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Заказ не найден' });

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(req.params.id);
    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    console.error('Ошибка получения заказа:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ── PATCH /api/orders/:id/status ───────────────────────────────────────────
router.patch('/:id/status', (req, res) => {
  const VALID = ['new', 'confirmed', 'delivering', 'done', 'cancelled'];
  try {
    const db = getDb();
    const { status } = req.body;
    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, error: `Допустимые статусы: ${VALID.join(', ')}` });
    }
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Заказ не найден' });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, data: { orderId: req.params.id, status } });
  } catch (err) {
    console.error('Ошибка обновления статуса:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

module.exports = router;
