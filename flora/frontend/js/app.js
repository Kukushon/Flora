// ── Конфигурация API ───────────────────────────────────────────────────────
const API_URL = 'http://localhost:3001/api';

// ── Состояние приложения ───────────────────────────────────────────────────
const state = {
  cart:     [],   // [{ product, qty }]
  products: [],
  filter:   'all',
  search:   ''
};

// ── Загрузка данных с бэкенда ─────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Ошибка сервера');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Бэкенд недоступен, используем локальные данные:', err.message);
    return PRODUCTS;   // fallback на data.js
  }
}

// ── Рендер каталога ────────────────────────────────────────────────────────
function renderProducts(products) {
  const container = document.getElementById('products');

  const filtered = products.filter(p => {
    const catOk    = state.filter === 'all' || p.category === state.filter;
    const searchOk = !state.search || p.name.toLowerCase().includes(state.search.toLowerCase());
    return catOk && searchOk;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--mid);text-align:center;grid-column:1/-1;padding:40px 0">Ничего не найдено</p>';
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="product-card__img">
        ${p.emoji}
        ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-card__body">
        <p class="product-card__cat">${p.categoryLabel}</p>
        <p class="product-card__name">${p.name}</p>
        <p class="product-card__desc">${p.description || p.desc || ''}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${p.price.toLocaleString('ru')} ₽</span>
          <button class="add-btn" id="add-${p.id}" onclick="event.stopPropagation(); addToCart(${p.id})" aria-label="Добавить в корзину">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Корзина ────────────────────────────────────────────────────────────────
function addToCart(productId) {
  const product  = state.products.find(p => p.id === productId);
  const existing = state.cart.find(item => item.product.id === productId);

  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ product, qty: 1 });
  }

  const btn = document.getElementById(`add-${productId}`);
  if (btn) {
    btn.textContent = '✓';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = '+'; btn.classList.remove('added'); }, 1000);
  }

  updateCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.product.id !== productId);
  updateCart();
}

function changeQty(productId, delta) {
  const item = state.cart.find(i => i.product.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else updateCart();
}

function getTotal() {
  return state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function updateCart() {
  const count   = state.cart.reduce((s, i) => s + i.qty, 0);
  const countEl = document.getElementById('cartCount');
  countEl.textContent = count;
  countEl.classList.toggle('visible', count > 0);

  renderCartItems();
  document.getElementById('cartTotal').textContent = getTotal().toLocaleString('ru') + ' ₽';
  document.getElementById('cartFooter').style.display = state.cart.length ? '' : 'none';
}

function renderCartItems() {
  const el = document.getElementById('cartItems');
  if (state.cart.length === 0) {
    el.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    return;
  }
  el.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__emoji">${item.product.emoji}</div>
      <div class="cart-item__info">
        <p class="cart-item__name">${item.product.name}</p>
        <p class="cart-item__price">${(item.product.price * item.qty).toLocaleString('ru')} ₽</p>
      </div>
      <div class="cart-item__qty">
        <button class="qty-btn" onclick="changeQty(${item.product.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.product.id}, 1)">+</button>
      </div>
    </div>
  `).join('');
}

// ── Дровер корзины ─────────────────────────────────────────────────────────
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Модалка заказа ─────────────────────────────────────────────────────────
function openModal() {
  closeCart();
  goStep(1);
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('deliveryDate').min   = today;
  document.getElementById('deliveryDate').value = today;
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function goStep(n) {
  [1, 2, 3, 'Success'].forEach(s => {
    const el = document.getElementById(`page${s}`);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
    el.classList.toggle('done',   i + 1 < n);
  });
  if (n === 3) buildSummary();
  document.getElementById(`page${n}`).style.display = '';
}

// Расчёт стоимости доставки с учётом бесплатной от 5000 ₽
function getDeliveryCost() {
  const delivType = document.querySelector('input[name="delivType"]:checked')?.value;
  if (delivType !== 'express' && getTotal() >= 5000) return 0;
  return delivType === 'express' ? 600 : 300;
}

function buildSummary() {
  const delivType = document.querySelector('input[name="delivType"]:checked')?.value;
  const delivCost = getDeliveryCost();
  const cartTotal = getTotal();
  const items = state.cart.map(i =>
    `<p><span>${i.product.name} × ${i.qty}</span><span>${(i.product.price * i.qty).toLocaleString('ru')} ₽</span></p>`
  ).join('');

  let delivLabel;
  if (delivType === 'express') {
    delivLabel = 'Экспресс';
  } else if (cartTotal >= 5000) {
    delivLabel = 'Стандартная — бесплатно!';
  } else {
    delivLabel = 'Стандартная';
  }

  document.getElementById('orderSummary').innerHTML = `
    ${items}
    <p><span>Доставка (${delivLabel})</span><span>${delivCost === 0 ? 'Бесплатно' : delivCost + ' ₽'}</span></p>
    <p><span>Итого</span><span>${(cartTotal + delivCost).toLocaleString('ru')} ₽</span></p>
  `;
}

// ── Оформление заказа → отправка на бэкенд ────────────────────────────────
async function placeOrder() {
  const delivType = document.querySelector('input[name="delivType"]:checked')?.value;
  const delivCost = getDeliveryCost();

  const orderData = {
    recipient: {
      name:        document.getElementById('recipientName').value,
      phone:       document.getElementById('recipientPhone').value,
      cardMessage: document.getElementById('cardMessage').value
    },
    delivery: {
      address:  document.getElementById('address').value,
      date:     document.getElementById('deliveryDate').value,
      timeSlot: document.getElementById('timeSlot').value,
      type:     delivType
    },
    payment: document.querySelector('input[name="payment"]:checked')?.value,
    items:   state.cart.map(i => ({
      productId: i.product.id,
      qty:       i.qty,
      price:     i.product.price
    })),
    total: getTotal() + delivCost
  };

  // ── Отправка на сервер ───────────────────────────────────────────────────
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderData)
    });

    const result = await res.json();

    if (!res.ok) {
      const errorText = result.errors ? result.errors.join(', ') : result.error;
      alert('Ошибка: ' + errorText);
      return;
    }

    console.log('✅ Заказ создан, ID:', result.data.orderId);
  } catch (err) {
    // Если бэкенд недоступен — всё равно показываем успех (для демо)
    console.warn('Не удалось отправить на сервер:', err.message);
  }

  // ── Показываем экран успеха ───────────────────────────────────────────────
  [1, 2, 3].forEach(s => {
    const el = document.getElementById(`page${s}`);
    if (el) el.style.display = 'none';
  });
  document.getElementById('pageSuccess').style.display = '';
  document.querySelectorAll('.step').forEach(el => el.classList.add('done'));

  state.cart = [];
  updateCart();
}

// ── Фильтры ──────────────────────────────────────────────────────────────
function initFilters(products) {
  document.getElementById('filters').addEventListener('click', e => {
    if (!e.target.classList.contains('filter-btn')) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    state.filter = e.target.dataset.cat;
    renderProducts(products);
  });
}

// ── Поиск ────────────────────────────────────────────────────────────────
function initSearch(products) {
  document.getElementById('searchBtn').addEventListener('click', () => {
    const bar = document.getElementById('searchBar');
    bar.style.display = bar.style.display === 'none' ? '' : 'none';
    if (bar.style.display !== 'none') document.getElementById('searchInput').focus();
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    state.search = e.target.value;
    renderProducts(products);
  });
}

// ── Header scroll ─────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 10);
});

// ── Открыть продукт ───────────────────────────────────────────────────────
function openProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  if (confirm(`${p.emoji} ${p.name}\n${p.description || p.desc || ''}\nЦена: ${p.price.toLocaleString('ru')} ₽\n\nДобавить в корзину?`)) {
    addToCart(id);
    openCart();
  }
}

// ── Инициализация ──────────────────────────────────────────────────────────
async function init() {
  const products    = await loadProducts();
  state.products    = products;

  renderProducts(products);
  initFilters(products);
  initSearch(products);

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('orderBtn').addEventListener('click', openModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCart(); closeModal(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
