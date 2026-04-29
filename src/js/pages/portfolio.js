// ============================================
// NOVENTRA PWA — Portfolio & Assets Page (Robust Version)
// ============================================
import { 
  getPortfolio, 
  addAsset, 
  deleteAsset, 
  calculateAssetValue, 
  calculateTotalValue, 
  ASSET_TYPES 
} from '../services/portfolio-service.js';
import { getCurrentPrices, onPriceUpdate } from '../services/price-service.js';
import { getGoals, addGoal, deleteGoal } from '../services/goal-service.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

let unsubscribe = null;
let currentTab = 'assets';

export function renderPortfolio(container) {
  // 1. App Shell
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:25px;">
      <h2 class="page__title">💰 Portföyüm</h2>
      <p class="page__subtitle">Varlıklarını yönet ve toplam değerini izle</p>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:25px;">
      <button class="tab-btn ${currentTab === 'assets' ? 'active' : ''}" data-tab="assets">Varlıklarım</button>
      <button class="tab-btn ${currentTab === 'goals' ? 'active' : ''}" data-tab="goals">Birikim Hedefleri</button>
    </div>

    <div id="tab-content"></div>
  `;

  // 2. Global Event Listener for the entire page (Event Delegation)
  container.addEventListener('click', handleGlobalClicks);

  // Initial Render
  renderTab(currentTab);

  // 3. Live Price Updates (Smart Rerender)
  unsubscribe = onPriceUpdate(() => {
    // Only update the summary and lists, don't touch the form to prevent losing user input
    updateLiveValues();
  });

  return { 
    destroy: () => { 
      if (unsubscribe) unsubscribe(); 
      container.removeEventListener('click', handleGlobalClicks);
    } 
  };
}

function handleGlobalClicks(e) {
  const target = e.target;

  // Tab Switching
  if (target.classList.contains('tab-btn')) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    target.classList.add('active');
    currentTab = target.dataset.tab;
    renderTab(currentTab);
    return;
  }

  // Add Asset Button
  if (target.id === 'btn-add-asset') {
    const typeId = document.getElementById('asset-type').value;
    const amount = document.getElementById('asset-amount').value;
    const buyPrice = document.getElementById('asset-buy-price').value || 0;
    
    if (!amount || amount <= 0) {
      alert("Lütfen geçerli bir miktar girin.");
      return;
    }
    
    addAsset(typeId, amount, buyPrice);
    renderTab('assets'); // Force full rerender after adding
    return;
  }

  // Delete Asset
  const deleteBtn = target.closest('.delete-asset-btn');
  if (deleteBtn) {
    if (confirm("Bu varlığı silmek istediğinize emin misiniz?")) {
      deleteAsset(deleteBtn.dataset.id);
      renderTab('assets');
    }
    return;
  }
}

function renderTab(tabName) {
  const content = document.getElementById('tab-content');
  if (!content) return;

  if (tabName === 'assets') {
    renderAssetsTab(content);
  } else {
    renderGoalsTab(content);
  }
}

function renderAssetsTab(container) {
  const prices = getCurrentPrices();
  const gramPrice = prices.gram_altin?.marginSell || 0;
  const portfolio = getPortfolio();
  const totalValue = calculateTotalValue(gramPrice);

  container.innerHTML = `
    <!-- Portfolio Summary -->
    <div id="portfolio-summary-container">
       ${getSummaryHtml(totalValue, gramPrice)}
    </div>

    <!-- Add Form (Stable) -->
    <div class="card" style="margin-bottom:25px; padding:20px; border:1px solid var(--border-subtle); background:var(--bg-elevated);">
      <h3 style="font-size:14px; font-weight:700; margin-bottom:15px; color:var(--gold-500);">+ Yeni Varlık Ekle</h3>
      <div style="display:grid; gap:12px;">
        <select id="asset-type" class="input" style="width:100%;">
          ${Object.values(ASSET_TYPES).map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
        </select>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input type="number" id="asset-amount" placeholder="Miktar" class="input">
          <input type="number" id="asset-buy-price" placeholder="Alış Fiyatı" class="input">
        </div>
        <button id="btn-add-asset" class="btn btn-gold" style="width:100%; padding:14px; border-radius:12px; font-weight:800;">VARLIĞI KAYDET</button>
      </div>
    </div>

    <!-- Assets List Container -->
    <div id="assets-list" class="grid-1">
      ${getAssetsListHtml(portfolio, gramPrice)}
    </div>
  `;
}

function updateLiveValues() {
  const prices = getCurrentPrices();
  const gramPrice = prices.gram_altin?.marginSell || 0;
  const portfolio = getPortfolio();
  const totalValue = calculateTotalValue(gramPrice);

  const summaryEl = document.getElementById('portfolio-summary-container');
  const listEl = document.getElementById('assets-list');

  if (summaryEl) summaryEl.innerHTML = getSummaryHtml(totalValue, gramPrice);
  if (listEl) listEl.innerHTML = getAssetsListHtml(portfolio, gramPrice);
}

function getSummaryHtml(totalValue, gramPrice) {
  return `
    <div class="portfolio-summary-card glow-gold" style="margin-bottom:25px; padding:30px; text-align:center;">
      <div style="font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:2px; font-weight:700; margin-bottom:10px;">TOPLAM VARLIK DEĞERİ</div>
      <div style="font-size:36px; font-weight:800; color:white; font-family:var(--font-mono);">${formatCurrency(totalValue)}</div>
      <div style="margin-top:15px; font-size:13px; color:var(--gold-500); font-weight:600; background:rgba(212,168,83,0.1); display:inline-block; padding:5px 15px; border-radius:20px;">
        Baz Fiyat: ${formatCurrency(gramPrice)} / gr
      </div>
    </div>
  `;
}

function getAssetsListHtml(portfolio, gramPrice) {
  if (portfolio.length === 0) {
    return `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px;">Henüz varlık eklemediniz.</div>`;
  }

  return portfolio.map(asset => {
    const type = Object.values(ASSET_TYPES).find(t => t.id === asset.typeId);
    const currentValue = calculateAssetValue(asset, gramPrice);
    const profit = asset.purchasePrice > 0 ? currentValue - (asset.amount * asset.purchasePrice) : 0;
    const profitPercent = asset.purchasePrice > 0 ? (profit / (asset.amount * asset.purchasePrice)) * 100 : 0;

    return `
      <div class="card" style="margin-bottom:15px; padding:18px; border:1px solid rgba(255,255,255,0.05); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-size:14px;">${type.label}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${formatNumber(asset.amount)} ${type.unit}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; font-size:15px; color:white;">${formatCurrency(currentValue)}</div>
            ${asset.purchasePrice > 0 ? `
              <div style="font-size:11px; font-weight:700; color:${profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}; margin-top:4px;">
                ${profit >= 0 ? '+' : ''}${formatCurrency(profit)} (%${formatNumber(profitPercent)})
              </div>
            ` : ''}
          </div>
        </div>
        <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center; opacity:0.5;">
          <div style="font-size:10px;">Eklenme: ${new Date(asset.date).toLocaleDateString()}</div>
          <button class="delete-asset-btn" data-id="${asset.id}" style="background:none; border:none; color:var(--color-danger); font-size:16px; cursor:pointer;">✕</button>
        </div>
      </div>
    `;
  }).reverse().join('');
}

function renderGoalsTab(container) {
  // (Goals tab implementation remains same or simplified for this fix)
  container.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5;">Birikim Hedefleri yakında güncellenecek.</div>`;
}
