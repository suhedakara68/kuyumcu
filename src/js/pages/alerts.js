// ============================================
// NOVENTRA PWA — Alerts Page
// ============================================
import { getAlerts, addAlert, deleteAlert, toggleAlert } from '../services/alert-service.js';
import { getCurrentPrices } from '../services/price-service.js';
import { formatCurrency } from '../utils/formatters.js';

export function renderAlerts(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2 class="page__title">🛎️ Fiyat Alarmları</h2>
      <p class="page__subtitle">Fiyatlar belirlediğiniz seviyeye gelince bildirim alın</p>
    </div>

    <div class="card card-gold" style="margin-bottom:var(--space-6);">
      <h3 style="margin-bottom:var(--space-4); font-size:var(--font-size-md);">Yeni Alarm Kur</h3>
      <div class="calc-form">
        <div class="input-group">
          <label>Varlık Seçin</label>
          <select class="select" id="alert-symbol">
            <option value="gram_altin">Gram Altın</option>
            <option value="ceyrek_altin">Çeyrek Altın</option>
            <option value="usd_try">USD/TRY</option>
            <option value="eur_try">EUR/TRY</option>
            <option value="bilezik_22">22 Ayar Bilezik</option>
          </select>
        </div>
        <div class="input-row">
          <div class="input-group">
            <label>Koşul</label>
            <select class="select" id="alert-condition">
              <option value="above">Geçince (>=)</option>
              <option value="below">Düşünce (<=)</option>
            </select>
          </div>
          <div class="input-group">
            <label>Hedef Fiyat (TL)</label>
            <input type="number" class="input" id="alert-price" placeholder="Örn: 3000">
          </div>
        </div>
        <button class="btn btn-gold btn-block" id="set-alert-btn">Alarmı Kur</button>
      </div>
    </div>

    <div id="active-alerts-list" class="grid-1 stagger"></div>
  `;

  renderAlertList();

  document.getElementById('set-alert-btn').addEventListener('click', () => {
    const symbol = document.getElementById('alert-symbol').value;
    const condition = document.getElementById('alert-condition').value;
    const price = document.getElementById('alert-price').value;
    const label = document.getElementById('alert-symbol').options[document.getElementById('alert-symbol').selectedIndex].text;

    if (!price) return;

    addAlert({
      symbol,
      label,
      targetPrice: price,
      condition
    });

    document.getElementById('alert-price').value = '';
    renderAlertList();
  });

  return {};
}

function renderAlertList() {
  const list = document.getElementById('active-alerts-list');
  if (!list) return;
  const alerts = getAlerts();

  if (alerts.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">🔔</div>
      <div class="empty-state__title">Aktif alarm yok</div>
      <div class="empty-state__desc">Fiyat takibi için yeni bir alarm kurun</div>
    </div>`;
    return;
  }

  list.innerHTML = alerts.map(a => `
    <div class="card alert-card ${!a.isActive ? 'is-disabled' : ''}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:var(--font-weight-bold); font-size:var(--font-size-md);">${a.label}</div>
          <div style="font-size:var(--font-size-sm); color:var(--text-muted);">
            ${a.condition === 'above' ? 'Fiyat geçince:' : 'Fiyat düşünce:'} 
            <span style="color:var(--text-gold); font-weight:600;">${formatCurrency(a.targetPrice)}</span>
          </div>
        </div>
        <div style="display:flex; gap:var(--space-2);">
          <button class="btn-icon btn-ghost toggle-alert" data-id="${a.id}" title="${a.isActive ? 'Durdur' : 'Başlat'}">
            ${a.isActive ? '⏸️' : '▶️'}
          </button>
          <button class="btn-icon btn-ghost delete-alert" data-id="${a.id}" style="color:var(--color-danger);">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners to list buttons
  list.querySelectorAll('.delete-alert').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteAlert(btn.dataset.id);
      renderAlertList();
    });
  });

  list.querySelectorAll('.toggle-alert').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleAlert(btn.dataset.id);
      renderAlertList();
    });
  });
}
