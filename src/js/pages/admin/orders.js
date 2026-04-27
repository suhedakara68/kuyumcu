// ============================================
// KUYUMCU PWA — Admin Orders Management
// ============================================
import { navigate } from '../../router.js';
import { isAdmin } from './login.js';
import { getOrders, updateOrderStatus, ORDER_STATUSES } from '../../services/order-service.js';
import { formatDate } from '../../utils/formatters.js';

export function renderAdminOrders(container) {
  if (!isAdmin()) { navigate('/admin'); return; }

  const header = document.querySelector('.header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'none';
  if (nav) nav.style.display = 'none';

  container.className = 'page';
  container.innerHTML = `
    <div class="admin-header">
      <button class="admin-header__back" id="orders-back">←</button>
      <h3 style="font-size:var(--font-size-md);">📋 Sipariş Yönetimi</h3>
    </div>
    <div style="padding:var(--space-4);">
      <div class="tabs" id="order-tabs">
        <div class="tab active" data-status="all">Tümü</div>
        <div class="tab" data-status="pending">Bekleyen</div>
        <div class="tab" data-status="confirmed">Onaylı</div>
        <div class="tab" data-status="completed">Tamam</div>
      </div>
      <div class="grid-1 stagger" id="admin-order-list"></div>
    </div>
  `;

  let currentFilter = 'all';

  document.getElementById('orders-back').addEventListener('click', () => navigate('/admin/dashboard'));

  document.querySelectorAll('#order-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#order-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.status;
      renderList(currentFilter);
    });
  });

  document.getElementById('admin-order-list').addEventListener('change', (e) => {
    const select = e.target.closest('.order-status-select');
    if (select) {
      updateOrderStatus(select.dataset.id, select.value);
      renderList(currentFilter);
    }
  });

  renderList(currentFilter);

  return {
    destroy: () => {
      const h = document.querySelector('.header');
      const n = document.querySelector('.bottom-nav');
      if (h) h.style.display = '';
      if (n) n.style.display = '';
    }
  };
}

function renderList(filter) {
  const list = document.getElementById('admin-order-list');
  if (!list) return;
  const orders = getOrders(filter);

  if (orders.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">📭</div>
      <div class="empty-state__title">Sipariş yok</div>
    </div>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const status = ORDER_STATUSES[o.status] || ORDER_STATUSES.pending;
    const statusOptions = Object.entries(ORDER_STATUSES).map(([key, val]) =>
      `<option value="${key}" ${key === o.status ? 'selected' : ''}>${val.icon} ${val.label}</option>`
    ).join('');

    return `
      <div class="order-card" style="border-left:3px solid var(--color-${status.color === 'gold' ? 'warning' : status.color});">
        <div class="order-card__header">
          <div>
            <div class="order-card__id">${o.id}</div>
            <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px;">${formatDate(new Date(o.createdAt))}</div>
          </div>
          <select class="select order-status-select" data-id="${o.id}" style="width:auto;padding:var(--space-2) var(--space-3);font-size:var(--font-size-xs);padding-right:28px;">
            ${statusOptions}
          </select>
        </div>
        <div class="divider"></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2); font-size:var(--font-size-sm);">
          <div><span style="color:var(--text-muted);">Müşteri:</span> ${o.customerName}</div>
          <div><span style="color:var(--text-muted);">Telefon:</span> ${o.phone || '-'}</div>
          <div><span style="color:var(--text-muted);">Ürün:</span> ${o.product}</div>
          <div><span style="color:var(--text-muted);">Detay:</span> ${o.weight}gr ${o.karat}K</div>
        </div>
        ${o.note ? `<div style="margin-top:var(--space-2);font-size:var(--font-size-xs);color:var(--text-muted);font-style:italic;">📝 ${o.note}</div>` : ''}
      </div>
    `;
  }).join('');
}
