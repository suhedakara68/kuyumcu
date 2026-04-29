// ============================================
// KUYUMCU PWA — Home Page (Recovery Fix)
// ============================================
import { onPriceUpdate, isApiConnected, GOLD_KEYS, CURRENCY_KEYS, getPriceHistory } from '../services/price-service.js';
import { formatCurrency, formatTime } from '../utils/formatters.js';
import { GoldChart } from '../components/tv-chart.js';
import { generateAnalysis } from '../services/analysis-service.js';

let unsubscribe = null;
let activeChart = null;

export function renderHome(container) {
  try {
    container.innerHTML = `
      <div class="news-ticker">
        <div class="news-ticker__wrapper" id="news-marquee">
          <span>Noventra: Profesyonel Analiz Ekranı Yayında.</span>
          <span>Altın fiyatları anlık olarak güncelleniyor.</span>
        </div>
      </div>

      <div class="section" style="padding-top:10px;">
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
              <h2 style="font-size:18px; font-weight:800; color:white;">Piyasalar</h2>
              <div id="banner-time" style="font-size:11px; color:var(--text-muted);">Güncelleniyor...</div>
            </div>
            <div id="live-badge" class="badge badge-api">Canlı</div>
         </div>

         <div class="market-card">
            <div style="padding:15px 16px; font-weight:800; font-size:12px; color:var(--gold-500); border-bottom:1px solid rgba(255,255,255,0.05);">
               ALTIN VE DÖVİZ KURU
            </div>
            <div id="market-list-container"></div>
         </div>
      </div>

      <!-- Chart Modal -->
      <div class="modal-overlay" id="chart-modal">
        <div class="modal" style="height:90vh; display:flex; flex-direction:column; background:var(--bg-elevated); padding:0;">
          <div class="modal__handle"></div>
          <div style="padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
              <h3 id="chart-title" style="color:white; margin:0;">Grafik</h3>
              <button id="close-chart" style="background:none; border:none; color:white; font-size:20px;">✕</button>
            </div>
            <div id="tv-chart-container" style="width:100%; height:300px; background:black; border-radius:12px;"></div>
            <div id="analysis-panel" style="margin-top:20px;"></div>
          </div>
        </div>
      </div>
    `;

    setupListeners();

    unsubscribe = onPriceUpdate((prices) => {
      try {
        updateUI(prices);
        if (activeChart && activeChart.currentKey) {
          const h = getPriceHistory(activeChart.currentKey);
          if (h && h.length > 0) activeChart.update(h[h.length - 1]);
        }
      } catch (e) { console.error("Update UI Error:", e); }
    });

  } catch (err) {
    container.innerHTML = `<div style="padding:40px; text-align:center; color:white;">Yükleme Hatası. Lütfen sayfayı yenileyin.</div>`;
  }

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}

function setupListeners() {
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.market-row');
    if (row) openChart(row.dataset.key, row.dataset.name);

    if (e.target.id === 'close-chart') {
      document.getElementById('chart-modal').classList.remove('active');
      activeChart = null;
    }
  });
}

async function openChart(key, name) {
  const modal = document.getElementById('chart-modal');
  modal.classList.add('active');
  document.getElementById('chart-title').textContent = name;
  
  try {
    const history = getPriceHistory(key);
    activeChart = new GoldChart('tv-chart-container');
    activeChart.currentKey = key;
    await activeChart.init();
    activeChart.setData(history);
    
    // Simple analysis display
    const panel = document.getElementById('analysis-panel');
    const analysis = generateAnalysis(history.map(x => x.close));
    if (analysis) {
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px;">
          <span style="font-weight:bold; color:${analysis.signalColor}">${analysis.signal}</span>
          <span style="color:var(--text-muted)">RSI: ${analysis.rsi.toFixed(2)}</span>
        </div>
      `;
    }
  } catch (e) { console.error("Chart Error:", e); }
}

function updateUI(prices) {
  const container = document.getElementById('market-list-container');
  if (!container) return;

  const timeEl = document.getElementById('banner-time');
  if (timeEl && prices.gram_altin) timeEl.textContent = `Son Güncelleme: ${new Date(prices.gram_altin.updatedAt).toLocaleTimeString()}`;

  const keys = [...GOLD_KEYS, ...CURRENCY_KEYS];
  container.innerHTML = keys.map(k => {
    const p = prices[k];
    if (!p) return '';
    return `
      <div class="market-row" data-key="${p.key}" data-name="${p.name}" style="display:flex; justify-content:space-between; padding:15px 16px; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer;">
        <div style="font-weight:600; color:white;">${p.name}</div>
        <div style="text-align:right;">
          <div style="font-weight:800; color:white;">${formatCurrency(p.marginSell).replace('₺', '')}</div>
          <div style="font-size:11px; color:${p.direction === 'up' ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight:700;">
            ${p.direction === 'up' ? '▲' : '▼'} %${Math.abs(p.change || 0).toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
