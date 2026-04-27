// ============================================
// KUYUMCU PWA — Alarms Page
// ============================================
import { getAlarms, addAlarm, removeAlarm, toggleAlarm } from '../services/alarm-service.js';
import { getCurrentPrices, GOLD_KEYS, CURRENCY_KEYS } from '../services/price-service.js';
import { formatCurrency } from '../utils/formatters.js';

export function renderAlarms(container) {
  container.innerHTML = `
    <h2 class="page__title">🔔 Fiyat Alarmları</h2>
    <p class="page__subtitle">Hedef fiyata ulaşıldığında bildirim alın</p>

    <button class="btn btn-gold btn-block" id="add-alarm-btn" style="margin-bottom:var(--space-5);">
      ➕ Yeni Alarm Ekle
    </button>

    <div class="grid-1 stagger" id="alarm-list"></div>

    <div class="modal-overlay" id="alarm-modal">
      <div class="modal">
        <div class="modal__handle"></div>
        <h3 style="margin-bottom:var(--space-4);">Yeni Fiyat Alarmı</h3>
        <div class="calc-form">
          <div class="input-group">
            <label>Fiyat Türü</label>
            <select class="select" id="alarm-type">
              ${[...GOLD_KEYS, ...CURRENCY_KEYS].map(k => {
                const p = getCurrentPrices()[k];
                return p ? `<option value="${k}">${p.name}</option>` : '';
              }).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Koşul</label>
            <select class="select" id="alarm-condition">
              <option value="above">Üzerine çıkarsa ▲</option>
              <option value="below">Altına düşerse ▼</option>
            </select>
          </div>
          <div class="input-group">
            <label>Hedef Fiyat (₺)</label>
            <input type="number" class="input" id="alarm-target" placeholder="Örn: 3500" step="1">
          </div>
          <div style="display:flex; gap:var(--space-3);">
            <button class="btn btn-ghost btn-block" id="alarm-cancel">İptal</button>
            <button class="btn btn-gold btn-block" id="alarm-save">Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderAlarmList();

  document.getElementById('add-alarm-btn').addEventListener('click', () => {
    document.getElementById('alarm-modal').classList.add('active');
  });

  document.getElementById('alarm-cancel').addEventListener('click', () => {
    document.getElementById('alarm-modal').classList.remove('active');
  });

  document.getElementById('alarm-save').addEventListener('click', () => {
    const priceKey = document.getElementById('alarm-type').value;
    const condition = document.getElementById('alarm-condition').value;
    const targetPrice = parseFloat(document.getElementById('alarm-target').value);
    if (!targetPrice || isNaN(targetPrice)) return;

    addAlarm({ priceKey, condition, targetPrice });
    document.getElementById('alarm-modal').classList.remove('active');
    document.getElementById('alarm-target').value = '';
    renderAlarmList();
  });

  document.getElementById('alarm-list').addEventListener('click', (e) => {
    const delBtn = e.target.closest('.alarm-delete');
    if (delBtn) { removeAlarm(delBtn.dataset.id); renderAlarmList(); return; }
    const togBtn = e.target.closest('.alarm-toggle');
    if (togBtn) { toggleAlarm(togBtn.dataset.id); renderAlarmList(); }
  });

  return {};
}

function renderAlarmList() {
  const list = document.getElementById('alarm-list');
  if (!list) return;
  const alarms = getAlarms();
  const prices = getCurrentPrices();

  if (alarms.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">🔕</div>
      <div class="empty-state__title">Henüz alarm yok</div>
      <div class="empty-state__desc">Fiyat hedefi belirleyin, ulaşıldığında bildirim alın</div>
    </div>`;
    return;
  }

  list.innerHTML = alarms.map(a => {
    const p = prices[a.priceKey];
    const name = p ? p.name : a.priceKey;
    const condText = a.condition === 'above' ? '▲ Üzerine çıkarsa' : '▼ Altına düşerse';
    const statusBadge = a.triggeredAt
      ? '<span class="badge badge-success">Tetiklendi ✓</span>'
      : a.active
        ? '<span class="badge badge-warning">Aktif</span>'
        : '<span class="badge" style="background:var(--bg-surface-3);color:var(--text-muted);">Pasif</span>';

    return `
      <div class="alarm-card">
        <div class="alarm-card__icon">🔔</div>
        <div class="alarm-card__body">
          <div class="alarm-card__title">${name}</div>
          <div class="alarm-card__desc">${condText}: ${formatCurrency(a.targetPrice)}</div>
          <div style="margin-top:4px;">${statusBadge}</div>
        </div>
        <div class="alarm-card__actions" style="display:flex;gap:var(--space-2);">
          <button class="btn-icon btn-ghost alarm-toggle" data-id="${a.id}" title="Aç/Kapat">${a.active ? '⏸️' : '▶️'}</button>
          <button class="btn-icon btn-ghost alarm-delete" data-id="${a.id}" title="Sil">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}
