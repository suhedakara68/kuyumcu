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
        <span>Altın fiyatları ABD verileri sonrası hareketlendi...</span>
        <span>Küresel piyasalarda gözler Fed faiz kararında...</span>
        <span>Dolar/TL paritesinde stabil seyir devam ediyor...</span>
        <span>Noventra: Kuyumculukta dijital dönüşümün öncüsü.</span>
      </div>
    </div>

    <div class="section" style="padding-top:0;">
       <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-4);">
          <div>
            <h2 style="font-size:20px; font-weight:800; color:var(--text-gold); margin-bottom:4px;">Piyasalar</h2>
            <div id="banner-time" style="font-size:11px; color:var(--text-muted);">Güncelleniyor...</div>
          </div>
          <div id="live-badge" class="badge badge-api">Canlı API</div>
       </div>

       <!-- Gold Market List -->
       <div class="market-card">
          <div style="padding:15px 16px; font-weight:800; font-size:14px; color:#d4a853; border-bottom:1px solid #eee; display:flex; align-items:center; gap:8px;">
             ALTIN FİYATLARI
          </div>
          <div class="market-header">
             <div>Ürün</div>
             <div>Alış</div>
             <div>Satış</div>
             <div>Fark</div>
             <div></div>
          </div>
          <div id="gold-list-container"></div>
       </div>

       <!-- Currency Market List -->
       <div class="market-card">
          <div style="padding:15px 16px; font-weight:800; font-size:14px; color:#3b82f6; border-bottom:1px solid #eee; display:flex; align-items:center; gap:8px;">
             DÖVİZ KURLARI
          </div>
          <div class="market-header">
             <div>Döviz</div>
             <div>Alış</div>
             <div>Satış</div>
             <div>Fark</div>
             <div></div>
          </div>
          <div id="currency-list-container"></div>
       </div>
    </div>

    <!-- Chart Modal -->
    <div class="modal-overlay" id="chart-modal">
      <div class="modal" style="height:80vh; display:flex; flex-direction:column; background:white;">
        <div class="modal__handle" style="background:#ddd;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
          <h3 id="chart-title" style="color:#333; font-weight:800;">Grafik</h3>
          <button class="btn-icon btn-ghost" id="close-chart" style="color:#999;">✕</button>
        </div>
        <div id="tv-chart-container" style="flex:1; width:100%; min-height:300px; border-radius:var(--radius-md); overflow:hidden; border:1px solid #eee;"></div>
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
    const card = e.target.closest('.market-row');
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

  const timeEl = document.getElementById('banner-time');
  if (timeEl) timeEl.innerHTML = `Son güncelleme: ${formatTime(gram.updatedAt)}`;
}

function updateGoldGrid(prices) {
  const container = document.getElementById('gold-list-container');
  if (!container) return;

  container.innerHTML = GOLD_KEYS.map(key => {
    const p = prices[key];
    if (!p) return '';
    return renderMarketRow(p);
  }).join('');
}

function updateCurrencyGrid(prices) {
  const container = document.getElementById('currency-list-container');
  if (!container) return;

  container.innerHTML = CURRENCY_KEYS.map(key => {
    const p = prices[key];
    if (!p) return '';
    return renderMarketRow(p);
  }).join('');
}

function renderMarketRow(p) {
  const changeColor = p.change >= 0 ? 'up' : 'down';
  const arrow = p.change >= 0 ? '↑' : '↓';
  
  return `
    <div class="market-row ${p.direction === 'up' ? 'up' : p.direction === 'down' ? 'down' : ''} btn-chart" data-key="${p.key}" data-name="${p.name}">
      <div class="market-name-cell">
        <span class="market-name">${p.name}</span>
        <span class="market-subname">${p.key.replace('_', ' ').toUpperCase()}</span>
      </div>
      <div class="market-price">${formatCurrency(p.marginBuy).replace('₺', '')}</div>
      <div class="market-price" style="font-weight:800;">${formatCurrency(p.marginSell).replace('₺', '')}</div>
      <div class="market-change ${changeColor}">
        ${arrow} %${Math.abs(p.change).toFixed(2)}
      </div>
      <div class="market-action">
        <div class="btn-chart-small">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
      </div>
    </div>
  `;
}

