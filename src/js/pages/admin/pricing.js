// ============================================
// KUYUMCU PWA — Admin Pricing (Margin Management)
// ============================================
import { navigate } from '../../router.js';
import { isAdmin } from './login.js';
import { onPriceUpdate, getMargins, saveMargins, GOLD_KEYS, CURRENCY_KEYS } from '../../services/price-service.js';
import { formatCurrency } from '../../utils/formatters.js';

let unsubscribe = null;

export function renderAdminPricing(container) {
  if (!isAdmin()) { navigate('/admin'); return; }

  const header = document.querySelector('.header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'none';
  if (nav) nav.style.display = 'none';

  container.className = 'page';
  container.innerHTML = `
    <div class="admin-header">
      <button class="admin-header__back" id="pricing-back">←</button>
      <h3 style="font-size:var(--font-size-md);">💰 Fiyat / Marj Yönetimi</h3>
    </div>
    <div style="padding:var(--space-4);">
      <p class="page__subtitle">Alış ve satış marjlarını yüzde (%) olarak ayarlayın. Negatif değer = indirim, pozitif = kâr.</p>
      <div class="grid-1 stagger" id="margin-list"></div>
      <button class="btn btn-gold btn-block btn-lg" id="save-margins" style="margin-top:var(--space-5);">
        💾 Marjları Kaydet
      </button>
    </div>
  `;

  document.getElementById('pricing-back').addEventListener('click', () => navigate('/admin/dashboard'));

  const margins = getMargins();

  unsubscribe = onPriceUpdate((prices) => {
    renderMarginList(prices, margins);
  });

  document.getElementById('save-margins').addEventListener('click', () => {
    const newMargins = {};
    [...GOLD_KEYS, ...CURRENCY_KEYS].forEach(key => {
      const buyEl = document.getElementById(`margin-buy-${key}`);
      const sellEl = document.getElementById(`margin-sell-${key}`);
      if (buyEl && sellEl) {
        newMargins[key] = {
          buyMargin: parseFloat(buyEl.value) || 0,
          sellMargin: parseFloat(sellEl.value) || 0
        };
      }
    });
    saveMargins(newMargins);
    showSaveToast();
  });

  return {
    destroy: () => {
      if (unsubscribe) unsubscribe();
      const h = document.querySelector('.header');
      const n = document.querySelector('.bottom-nav');
      if (h) h.style.display = '';
      if (n) n.style.display = '';
    }
  };
}

function renderMarginList(prices, margins) {
  const list = document.getElementById('margin-list');
  if (!list) return;

  // Only render once (don't re-render on every price update to avoid input focus loss)
  if (list.children.length > 0) {
    // Just update the preview prices
    [...GOLD_KEYS, ...CURRENCY_KEYS].forEach(key => {
      const p = prices[key];
      if (!p) return;
      const buyPreview = document.getElementById(`preview-buy-${key}`);
      const sellPreview = document.getElementById(`preview-sell-${key}`);
      const buyInput = document.getElementById(`margin-buy-${key}`);
      const sellInput = document.getElementById(`margin-sell-${key}`);
      if (buyPreview && buyInput) {
        const bm = parseFloat(buyInput.value) || 0;
        buyPreview.textContent = formatCurrency(p.buy * (1 + bm / 100));
      }
      if (sellPreview && sellInput) {
        const sm = parseFloat(sellInput.value) || 0;
        sellPreview.textContent = formatCurrency(p.sell * (1 + sm / 100));
      }
    });
    return;
  }

  list.innerHTML = [...GOLD_KEYS, ...CURRENCY_KEYS].map(key => {
    const p = prices[key];
    if (!p) return '';
    const m = margins[key] || { buyMargin: 0, sellMargin: 0 };
    return `
      <div class="margin-card">
        <div class="margin-card__header">
          <span class="margin-card__name">${p.icon} ${p.name}</span>
          <small style="color:var(--text-muted);">Piyasa: ${formatCurrency(p.buy)} / ${formatCurrency(p.sell)}</small>
        </div>
        <div class="margin-card__row" style="margin-top:var(--space-3);">
          <div class="margin-card__field">
            <div class="margin-card__field-label">Alış Marjı (%)</div>
            <input type="number" class="margin-input" id="margin-buy-${key}" value="${m.buyMargin}" step="0.1">
          </div>
          <div class="margin-card__field">
            <div class="margin-card__field-label">Satış Marjı (%)</div>
            <input type="number" class="margin-input" id="margin-sell-${key}" value="${m.sellMargin}" step="0.1">
          </div>
          <div class="margin-card__field">
            <div class="margin-card__field-label">Önizleme</div>
            <div style="font-size:var(--font-size-xs);">
              <span class="text-success" id="preview-buy-${key}">${formatCurrency(p.buy * (1 + m.buyMargin / 100))}</span>
              /
              <span class="text-danger" id="preview-sell-${key}">${formatCurrency(p.sell * (1 + m.sellMargin / 100))}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showSaveToast() {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span style="font-size:1.3rem;">✅</span><div><strong>Marjlar kaydedildi</strong><br><small>Fiyatlar güncelleniyor...</small></div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
