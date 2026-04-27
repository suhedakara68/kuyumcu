// ============================================
// KUYUMCU PWA — Home Page (Canlı Fiyatlar)
// ============================================
import { onPriceUpdate, isApiConnected, GOLD_KEYS, CURRENCY_KEYS } from '../services/price-service.js';
import { formatCurrency, formatPercent, formatTime } from '../utils/formatters.js';
import { renderTVChart, TV_SYMBOL_MAP } from '../components/tv-chart.js';
import { getMarketInsight } from '../services/crypto-service.js';

let unsubscribe = null;

export function renderHome(container) {
  container.innerHTML = `
    <div class="news-ticker">
      <div class="news-ticker__wrapper" id="news-marquee">
        <span>📉 Altın fiyatları ABD verileri sonrası hareketlendi...</span>
        <span>🌍 Küresel piyasalarda gözler Fed faiz kararında...</span>
        <span>🇹🇷 Dolar/TL paritesinde stabil seyir devam ediyor...</span>
        <span>💎 Noventra: Kuyumculukta yeni nesil dijital deneyim.</span>
      </div>
    </div>

    <div class="home-banner glow-gold" id="main-banner">
      <div class="home-banner__row">
        <div>
          <div class="home-banner__label">GRAM ALTIN</div>
          <div class="home-banner__price" id="banner-price">₺0,00</div>
          <div class="home-banner__subtitle" id="banner-time">Güncelleniyor...</div>
        </div>
        <div class="home-banner__change-wrap">
          <div class="price-card__change" id="banner-change">%0,00</div>
          <div class="home-banner__subtitle" id="banner-direction">—</div>
        </div>
      </div>
    </div>


    <div class="section">
      <div class="section__header">
        <h3 class="section__title">🏅 ALTIN FİYATLARI</h3>
        <span class="badge badge-api" id="live-badge">Canlı API</span>
      </div>
      <div class="grid-2 stagger" id="gold-grid"></div>
    </div>

    <div class="section">
      <div class="section__header">
        <span class="section__title">💱 Döviz Kurları</span>
      </div>
      <div class="grid-1 stagger" id="currency-grid"></div>
    </div>

    <!-- Chart Modal -->
    <div class="modal-overlay" id="chart-modal">
      <div class="modal" style="height:80vh; display:flex; flex-direction:column;">
        <div class="modal__handle"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
          <h3 id="chart-title">Grafik</h3>
          <button class="btn-icon btn-ghost" id="close-chart">✕</button>
        </div>
        <div id="tv-chart-container" style="flex:1; width:100%; min-height:300px; border-radius:var(--radius-md); overflow:hidden;"></div>
      </div>
    </div>
  `;

  unsubscribe = onPriceUpdate((prices) => {
    updateBanner(prices);
    updateGoldGrid(prices);
    updateCurrencyGrid(prices);
    updatePriceSpreads(prices);
    
    // Update API status badge
    const badge = document.getElementById('live-badge');
    if (badge) {
      const connected = isApiConnected();
      badge.innerHTML = `<span class="header__status-dot" style="width:6px;height:6px;background:var(--color-${connected ? 'success' : 'warning'});border-radius:50%;margin-right:4px;animation:pulse 2s infinite;display:inline-block;"></span>${connected ? 'Canlı API' : 'Demo'}`;
    }
  });

  // Chart interactions
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.price-card');
    if (!card) return;
    
    const key = card.dataset.key;
    const name = card.dataset.name;
    const tvSymbol = TV_SYMBOL_MAP[key];
    
    if (tvSymbol) {
      document.getElementById('chart-title').textContent = `${name} — Canlı Grafik`;
      document.getElementById('chart-modal').classList.add('active');
      renderTVChart('tv-chart-container', tvSymbol);
    }
  });

  document.getElementById('close-chart').addEventListener('click', () => {
    document.getElementById('chart-modal').classList.remove('active');
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}



function updatePriceSpreads(prices) {
  // Simüle edilmiş karşılaştırmalı veriler
  const spreads = [
    { label: 'Harem Altın', diff: -0.15 },
    { label: 'İAR', diff: 0.05 },
    { label: 'Serbest Piyasa', diff: -0.10 }
  ];
  
  // Bu verileri home sayfasındaki kartların altına veya yanına enjekte edebiliriz.
  // Şimdilik sadece konsola veya gizli bir alana yazalım veya UI'da küçük rozetler gösterelim.
}

function updateBanner(prices) {
  const gram = prices.gram_altin;
  if (!gram) return;

  const priceEl = document.getElementById('banner-price');
  const timeEl = document.getElementById('banner-time');
  const changeEl = document.getElementById('banner-change');
  const dirEl = document.getElementById('banner-direction');

  if (priceEl) {
    const prev = priceEl.textContent;
    const next = formatCurrency(gram.marginSell);
    priceEl.textContent = next;
    if (prev !== next && prev !== '₺0,00') {
      const banner = document.getElementById('main-banner');
      banner.classList.remove('flash-up', 'flash-down');
      void banner.offsetWidth;
      banner.classList.add(gram.direction === 'up' ? 'flash-up' : 'flash-down');
    }
  }
  if (timeEl) timeEl.textContent = `Son güncelleme: ${formatTime(gram.updatedAt)}`;
  if (changeEl) {
    changeEl.textContent = formatPercent(gram.change);
    changeEl.className = `price-card__change ${gram.change >= 0 ? 'up' : 'down'}`;
  }
  if (dirEl) dirEl.textContent = gram.direction === 'up' ? '📈 Yükseliyor' : gram.direction === 'down' ? '📉 Düşüyor' : '➡️ Sabit';
}

function updateGoldGrid(prices) {
  const grid = document.getElementById('gold-grid');
  if (!grid) return;

  grid.innerHTML = GOLD_KEYS.map(key => {
    const p = prices[key];
    if (!p) return '';
    return renderPriceCard(p);
  }).join('');
}

function updateCurrencyGrid(prices) {
  const grid = document.getElementById('currency-grid');
  if (!grid) return;

  grid.innerHTML = CURRENCY_KEYS.map(key => {
    const p = prices[key];
    if (!p) return '';
    return renderCurrencyCard(p);
  }).join('');
}

function renderPriceCard(p) {
  const dirClass = p.direction === 'up' ? 'is-up' : p.direction === 'down' ? 'is-down' : '';
  return `
    <div class="price-card ${dirClass} tap-scale" data-key="${p.key}" data-name="${p.name}">
      <div class="price-card__header">
        <div>
          <div class="price-card__icon">${p.icon}</div>
        </div>
        <div style="text-align:right;">
          <div class="price-card__name">${p.name}</div>
          <div class="price-card__change ${p.change >= 0 ? 'up' : 'down'}">${p.direction === 'up' ? '▲' : '▼'} ${formatPercent(p.change)}</div>
        </div>
      </div>
      <div class="price-card__prices">
        <div class="price-card__price-group">
          <label>Alış</label>
          <div class="price-card__price buy">${formatCurrency(p.marginBuy)}</div>
        </div>
        <div class="price-card__price-group">
          <label>Satış</label>
          <div class="price-card__price sell">${formatCurrency(p.marginSell)}</div>
        </div>
      </div>
      <div class="price-card__time">${formatTime(p.updatedAt)}</div>
    </div>
  `;
}

function renderCurrencyCard(p) {
  const dirClass = p.direction === 'up' ? 'is-up' : p.direction === 'down' ? 'is-down' : '';
  return `
    <div class="price-card ${dirClass} tap-scale" data-key="${p.key}" data-name="${p.name}" style="padding:var(--space-3) var(--space-4);">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <div class="price-card__icon">${p.icon}</div>
          <div>
            <div style="font-weight:600; font-size:var(--font-size-sm);">${p.name}</div>
            <div class="price-card__change ${p.change >= 0 ? 'up' : 'down'}" style="margin-top:2px;">${p.direction === 'up' ? '▲' : '▼'} ${formatPercent(p.change)}</div>
          </div>
        </div>
        <div style="display:flex; gap:var(--space-6); text-align:right;">
          <div>
            <div style="font-size:var(--font-size-xs); color:var(--text-muted);">Alış</div>
            <div class="price-card__price buy" style="font-size:var(--font-size-md);">${formatCurrency(p.marginBuy)}</div>
          </div>
          <div>
            <div style="font-size:var(--font-size-xs); color:var(--text-muted);">Satış</div>
            <div class="price-card__price sell" style="font-size:var(--font-size-md);">${formatCurrency(p.marginSell)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

