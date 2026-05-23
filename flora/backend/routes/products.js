const express = require('express');
const router  = express.Router();
const { getDb } = require('../db/database');

// ── GET /api/products ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    let sql    = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (req.query.category && req.query.category !== 'all') {
      sql += ' AND category = ?';
      params.push(req.query.category);
    }

    if (req.query.search) {
      sql += ' AND name LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    if (req.query.inStock) {
      sql += ' AND inStock = 1';
    }

    sql += ' ORDER BY id ASC';

    const products = db.prepare(sql).all(...params);

    // Преобразуем inStock из 0/1 в boolean
    const result = products.map(p => ({ ...p, inStock: Boolean(p.inStock) }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Ошибка получения товаров:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }

    res.json({ success: true, data: { ...product, inStock: Boolean(product.inStock) } });
  } catch (err) {
    console.error('Ошибка получения товара:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, category, categoryLabel, price, emoji, description, badge, inStock } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, error: 'Укажите name, category, price' });
    }

    const result = db.prepare(`
      INSERT INTO products (name, category, categoryLabel, price, emoji, description, badge, inStock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, categoryLabel || category, price, emoji || '🌸', description || '', badge || null, inStock !== false ? 1 : 0);

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error('Ошибка добавления товара:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ── PATCH /api/products/:id ───────────────────────────────────────────────
// Обновление наличия или любого поля товара
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Товар не найден' });

    const allowed = ['name', 'price', 'badge', 'inStock', 'description'];
    const updates = [];
    const values  = [];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(field === 'inStock' ? (req.body[field] ? 1 : 0) : req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Нет полей для обновления' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: { ...updated, inStock: Boolean(updated.inStock) } });
  } catch (err) {
    console.error('Ошибка обновления товара:', err);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

module.exports = router;
