// ============================================
// KUYUMCU PWA — Orders Page (Customer Side)
// ============================================
import { getOrders, addOrder, ORDER_STATUSES } from '../services/order-service.js';
import { formatDate } from '../utils/formatters.js';

export function renderOrders(container) {
  container.innerHTML = `
    <h2 class="page__title">📋 Siparişlerim</h2>
    <p class="page__subtitle">Sipariş ve talep takibi</p>

    <button class="btn btn-gold btn-block" id="new-order-btn" style="margin-bottom:var(--space-5);">
      ➕ Yeni Sipariş / Talep
    </button>

    <div class="grid-1 stagger" id="order-list"></div>

    <div class="modal-overlay" id="order-modal">
      <div class="modal">
        <div class="modal__handle"></div>
        <h3 style="margin-bottom:var(--space-4);">Yeni Sipariş</h3>
        <div class="calc-form">
          <div class="input-group">
            <label>Adınız</label>
            <input type="text" class="input" id="order-name" placeholder="Ad Soyad">
          </div>
          <div class="input-group">
            <label>Telefon</label>
            <input type="tel" class="input" id="order-phone" placeholder="0532 xxx xx xx">
          </div>
          <div class="input-group">
            <label>Ürün</label>
            <input type="text" class="input" id="order-product" placeholder="Örn: 22 Ayar Bilezik">
          </div>
          <div class="input-row">
            <div class="input-group">
              <label>Ağırlık (gr)</label>
              <input type="number" class="input" id="order-weight" placeholder="0" step="0.1">
            </div>
            <div class="input-group">
              <label>Ayar</label>
              <select class="select" id="order-karat">
                <option value="22">22 Ayar</option>
                <option value="24">24 Ayar</option>
                <option value="18">18 Ayar</option>
                <option value="14">14 Ayar</option>
              </select>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:var(--space-4);">
            <label>Not</label>
            <input type="text" class="input" id="order-note" placeholder="Özel istek veya not...">
          </div>
          <div style="display:flex; gap:var(--space-3); margin-bottom:var(--space-10);">
            <button class="btn btn-ghost btn-block" id="order-cancel">İptal</button>
            <button class="btn btn-gold btn-block" id="order-submit">Kaydet</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div class="modal-overlay" id="receipt-modal">
      <div class="modal" id="receipt-content"></div>
    </div>
  `;

  renderOrderList();

  // Check for pending order from products page
  const pendingProduct = localStorage.getItem('pending_order_product');
  if (pendingProduct) {
    document.getElementById('order-modal').classList.add('active');
    document.getElementById('order-product').value = pendingProduct;
    localStorage.removeItem('pending_order_product');
  }

  document.getElementById('new-order-btn').addEventListener('click', () => {
    document.getElementById('order-modal').classList.add('active');
  });

  document.getElementById('order-cancel').addEventListener('click', () => {
    document.getElementById('order-modal').classList.remove('active');
  });

  document.getElementById('order-submit').addEventListener('click', () => {
    const order = {
      customerName: document.getElementById('order-name').value.trim(),
      phone: document.getElementById('order-phone').value.trim(),
      product: document.getElementById('order-product').value.trim(),
      weight: parseFloat(document.getElementById('order-weight').value) || 0,
      karat: parseInt(document.getElementById('order-karat').value),
      note: document.getElementById('order-note').value.trim(),
    };

    if (!order.customerName || !order.product) return;

    addOrder(order);
    document.getElementById('order-modal').classList.remove('active');
    // Clear form
    ['order-name','order-phone','order-product','order-weight','order-note'].forEach(id => {
      document.getElementById(id).value = '';
    });
    renderOrderList();
  });

  return {};
}

function showReceipt(order) {
  const modal = document.getElementById('receipt-modal');
  const content = document.getElementById('receipt-content');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Noventra-Order-${order.id}`;

  content.innerHTML = `
    <div class="modal__handle"></div>
    <div class="receipt">
      <div class="receipt__header">
        <img src="/logo.png" alt="Logo" style="width:50px; height:50px; border-radius:10px; margin-bottom:var(--space-2);">
        <div style="font-weight:var(--font-weight-black); color:var(--text-gold);">NOVENTRA</div>
        <div style="font-size:var(--font-size-xs); color:var(--text-muted);">DİJİTAL SİPARİŞ FİŞİ</div>
      </div>
      
      <div class="receipt__body">
        <div class="receipt__row">
          <span>Sipariş No:</span>
          <span style="font-weight:700;">${order.id}</span>
        </div>
        <div class="receipt__row">
          <span>Tarih:</span>
          <span>${formatDate(new Date(order.createdAt))}</span>
        </div>
        <div style="margin:var(--space-4) 0; padding:var(--space-4) 0; border-top:1px dashed var(--border-gold); border-bottom:1px dashed var(--border-gold);">
          <div style="font-weight:700; margin-bottom:var(--space-2);">${order.product}</div>
          <div style="font-size:var(--font-size-sm); color:var(--text-muted);">${order.weight} gr • ${order.karat} Ayar</div>
          ${order.note ? `<div style="font-size:var(--font-size-xs); margin-top:var(--space-2); font-style:italic;">"${order.note}"</div>` : ''}
        </div>
        <div class="receipt__row">
          <span>Müşteri:</span>
          <span>${order.customerName}</span>
        </div>
      </div>

      <div class="receipt__qr">
        <img src="${qrUrl}" alt="QR Code" style="background:white; padding:10px; border-radius:10px; width:150px; height:150px;">
        <div style="margin-top:var(--space-3); font-size:var(--font-size-xs); color:var(--text-muted);">
          Mağaza onayı için bu QR kodu gösterin
        </div>
      </div>

      <button class="btn btn-gold btn-block" id="close-receipt" style="margin-top:var(--space-6);">Kapat</button>
    </div>
  `;

  modal.classList.add('active');
  document.getElementById('close-receipt').addEventListener('click', () => {
    modal.classList.remove('active');
  });
}

function renderOrderList() {
  const list = document.getElementById('order-list');
  if (!list) return;
  const orders = getOrders();

  if (orders.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">📦</div>
      <div class="empty-state__title">Henüz sipariş yok</div>
      <div class="empty-state__desc">İlk siparişinizi oluşturun</div>
    </div>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
    return `
      <div class="order-card">
        <div class="order-card__header">
          <div class="order-card__id" style="display:flex; align-items:center; gap:var(--space-2);">
            No: ${o.id.slice(-6)}
            <button class="btn-icon btn-ghost copy-id" data-id="${o.id}" style="font-size:10px; padding:2px;">📋</button>
          </div>
          <span class="badge badge-${status.color}">${status.icon} ${status.label}</span>
        </div>
        <div class="order-card__body">
          <div class="order-card__product">
            <div class="order-card__product-name">${o.product}</div>
            <div class="order-card__product-detail">${o.weight} gr • ${o.karat} Ayar</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4);">
            <div class="order-card__date">${formatDate(new Date(o.createdAt))}</div>
            <button class="btn btn-ghost btn-sm view-receipt" data-id="${o.id}">📄 Fişi Gör</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.view-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(o => o.id === btn.dataset.id);
      if (order) showReceipt(order);
    });
  });

  list.querySelectorAll('.copy-id').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(btn.dataset.id);
      btn.textContent = '✅';
      setTimeout(() => btn.textContent = '📋', 2000);
    });
  });
}
