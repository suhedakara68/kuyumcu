// ============================================
// NOVENTRA PWA — Portfolio & Goals Page
// ============================================
import { getAssets, addAsset, deleteAsset, calculateSummary } from '../services/portfolio-service.js';
import { getCurrentPrices, onPriceUpdate } from '../services/price-service.js';
import { getGoals, addGoal, deleteGoal } from '../services/goal-service.js';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters.js';

let unsubscribe = null;

export function renderPortfolio(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2 class="page__title">💰 Portföyüm</h2>
      <p class="page__subtitle">Varlıklarını yönet ve hedeflerine ulaş</p>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:var(--space-5);">
      <button class="tab-btn active" data-tab="assets">Varlıklar</button>
      <button class="tab-btn" data-tab="goals">Birikim Hedefleri</button>
    </div>

    <div id="tab-content">
       <!-- Content injected by tab logic -->
    </div>
  `;

  const tabs = container.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    });
  });

  // Default tab
  renderTab('assets');

  unsubscribe = onPriceUpdate(() => {
    const activeTab = container.querySelector('.tab-btn.active')?.dataset.tab;
    renderTab(activeTab);
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
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
  const summary = calculateSummary(prices);

  container.innerHTML = `
    <div class="portfolio-summary-card glow-gold" style="margin-bottom:20px;">
      <div class="portfolio-summary-card__label">TOPLAM VARLIK DEĞERİ</div>
      <div class="portfolio-summary-card__value">${formatCurrency(summary.totalValue)}</div>
      <div class="portfolio-summary-card__profit" style="color: ${summary.totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
        ${summary.totalProfit >= 0 ? '+' : ''}${formatCurrency(summary.totalProfit)} (${formatPercent(summary.totalProfitPercent)})
      </div>
    </div>

    <div class="card card-gold" style="margin-bottom:24px;">
      <h3 style="margin-bottom:12px; font-size:14px;">Yeni Varlık Ekle</h3>
      <div style="display:grid; grid-template-columns:1fr; gap:12px;">
        <select class="input" id="asset-symbol" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:8px;">
          <option value="gram_altin">Gram Altın</option>
          <option value="ceyrek_altin">Çeyrek Altın</option>
          <option value="usd_try">USD</option>
          <option value="eur_try">EUR</option>
          <option value="bilezik_22">22 Ayar Bilezik</option>
          <option value="ata_altin">Ata Altın</option>
        </select>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input type="number" class="input" id="asset-amount" placeholder="Miktar" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:8px;">
          <input type="number" class="input" id="asset-buy-price" placeholder="Alış Fiyatı" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:8px;">
        </div>
        <button class="btn btn-gold btn-block" id="add-asset-btn">Varlığı Kaydet</button>
      </div>
    </div>

    <div id="assets-list" class="grid-1 stagger">
      ${summary.assets.length === 0 ? `
        <div style="text-align:center; padding:40px; opacity:0.5;">Henüz varlık eklemediniz.</div>
      ` : summary.assets.map(a => `
        <div class="card" style="margin-bottom:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
              <div style="font-weight:700;">${a.label}</div>
              <div style="font-size:12px; color:var(--text-muted);">${a.amount} Birim</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700; color:var(--text-gold);">${formatCurrency(a.value)}</div>
              <div style="font-size:12px; color:${a.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight:bold;">
                ${a.profit >= 0 ? '▲' : '▼'} %${formatNumber(a.profitPercent)}
              </div>
            </div>
          </div>
          <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between;">
             <div style="font-size:11px; color:var(--text-muted);">Alış: ${formatCurrency(a.buyPrice)}</div>
             <button class="delete-asset" data-id="${a.id}" style="background:none; border:none; color:var(--color-danger); cursor:pointer;">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('add-asset-btn')?.addEventListener('click', () => {
    const symbol = document.getElementById('asset-symbol').value;
    const amount = document.getElementById('asset-amount').value;
    const buyPrice = document.getElementById('asset-buy-price').value;
    const label = document.getElementById('asset-symbol').options[document.getElementById('asset-symbol').selectedIndex].text;
    if (!amount || !buyPrice) return;
    addAsset({ symbol, amount, buyPrice, label });
    renderTab('assets');
  });

  container.querySelectorAll('.delete-asset').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteAsset(btn.dataset.id);
      renderTab('assets');
    });
  });
}

function renderGoalsTab(container) {
  const goals = getGoals();

  container.innerHTML = `
    <div class="card card-gold" style="margin-bottom:24px;">
      <h3 style="margin-bottom:12px; font-size:14px;">🎯 Yeni Hedef Belirle</h3>
      <div style="display:grid; grid-template-columns:1fr; gap:12px;">
        <input type="text" id="goal-title" class="input" placeholder="Hedef Adı (Örn: Düğün Birikimi)" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:8px;">
        <input type="number" id="goal-target" class="input" placeholder="Hedef Gram (Örn: 100)" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:8px;">
        <button class="btn btn-gold btn-block" id="add-goal-btn">Hedefi Başlat</button>
      </div>
    </div>

    <div id="goals-list" class="grid-1">
      ${goals.length === 0 ? `
        <div style="text-align:center; padding:40px; opacity:0.5;">Henüz birikim hedefi koymadınız.</div>
      ` : goals.map(g => {
        const progress = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
        const remaining = Math.max(0, g.targetAmount - g.currentAmount);
        
        return `
          <div class="card" style="margin-bottom:16px; padding:20px; border:1px solid ${progress >= 100 ? 'var(--color-success)' : 'rgba(212,168,83,0.2)'}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="font-weight:bold; font-size:16px;">${g.title}</div>
              <button class="delete-goal" data-id="${g.id}" style="background:none; border:none; opacity:0.5;">✕</button>
            </div>
            
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
              <span>Mevcut: <b>${formatNumber(g.currentAmount)} gr</b></span>
              <span>Hedef: <b>${formatNumber(g.targetAmount)} gr</b></span>
            </div>

            <!-- Progress Bar -->
            <div style="height:12px; background:rgba(255,255,255,0.05); border-radius:6px; overflow:hidden; margin-bottom:12px; border:1px solid rgba(255,255,255,0.1);">
              <div style="width:${progress}%; height:100%; background: ${progress >= 100 ? 'var(--color-success)' : 'var(--gradient-gold)'}; transition:width 1s ease;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size:14px; font-weight:bold; color:${progress >= 100 ? 'var(--color-success)' : 'var(--text-gold)'}">
                %${formatNumber(progress)} Tamamlandı
              </div>
              <div style="font-size:11px; color:var(--text-muted);">
                ${remaining > 0 ? `Kalan: <b>${formatNumber(remaining)} gr</b>` : '✨ Hedefe Ulaşıldı!'}
              </div>
            </div>

            ${progress >= 40 && progress < 100 ? `
              <div style="margin-top:12px; padding:8px; background:rgba(212,168,83,0.1); border-radius:8px; font-size:11px; color:var(--text-gold); text-align:center;">
                🚀 Harika gidiyorsun! Yolun yarısına yaklaştın.
              </div>
            ` : ''}
            ${progress >= 100 ? `
              <div style="margin-top:12px; padding:8px; background:rgba(46,204,113,0.1); border-radius:8px; font-size:11px; color:var(--color-success); text-align:center;">
                🎊 Tebrikler! Hedefine başarıyla ulaştın.
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('add-goal-btn')?.addEventListener('click', () => {
    const title = document.getElementById('goal-title').value;
    const target = document.getElementById('goal-target').value;
    if (!title || !target) return;
    addGoal({ title, targetAmount: target });
    renderTab('goals');
  });

  container.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteGoal(btn.dataset.id);
      renderTab('goals');
    });
  });
}
