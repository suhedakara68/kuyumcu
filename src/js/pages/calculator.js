// ============================================
// KUYUMCU PWA — Calculator Page
// ============================================
import { onPriceUpdate } from '../services/price-service.js';
import { formatCurrency, formatNumber, getKaratMultiplier } from '../utils/formatters.js';

let unsubscribe = null;
let currentGramPrice = 0;

export function renderCalculator(container) {
  container.innerHTML = `
    <h2 class="page__title"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold-500);flex-shrink:0;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg> Hesap Makinesi</h2>
    <p class="page__subtitle">Gram, ayar ve işçilik bazlı anlık fiyat hesaplayın</p>

    <div class="calc-display">
      <div class="calc-display__label">Hesaplanan Tutar</div>
      <div class="calc-display__value" id="calc-result">₺0,00</div>
      <div class="calc-display__sub" id="calc-detail">Değerleri girin</div>
    </div>

    <div class="calc-form">
      <div class="tabs" id="calc-tabs">
        <div class="tab active" data-mode="gram-to-tl">Gram → TL</div>
        <div class="tab" data-mode="tl-to-gram">TL → Gram</div>
      </div>

      <div id="calc-input-area">
        <div class="input-row">
          <div class="input-group">
            <label>Ağırlık (gram)</label>
            <input type="number" class="input" id="calc-gram" placeholder="0.00" step="0.01" min="0">
          </div>
          <div class="input-group">
            <label>Ayar</label>
            <select class="select" id="calc-karat">
              <option value="24">24 Ayar</option>
              <option value="22" selected>22 Ayar</option>
              <option value="18">18 Ayar</option>
              <option value="14">14 Ayar</option>
              <option value="8">8 Ayar</option>
            </select>
          </div>
        </div>

        <div class="input-group">
          <label>İşçilik Ücreti (₺)</label>
          <input type="number" class="input" id="calc-labor" placeholder="0" step="10" min="0" value="0">
        </div>
      </div>

      <div id="calc-tl-area" style="display:none;">
        <div class="input-row">
          <div class="input-group">
            <label>Tutar (₺)</label>
            <input type="number" class="input" id="calc-tl" placeholder="0.00" step="100" min="0">
          </div>
          <div class="input-group">
            <label>Ayar</label>
            <select class="select" id="calc-karat2">
              <option value="24">24 Ayar</option>
              <option value="22" selected>22 Ayar</option>
              <option value="18">18 Ayar</option>
              <option value="14">14 Ayar</option>
              <option value="8">8 Ayar</option>
            </select>
          </div>
        </div>
      </div>

      <div class="calc-quick-btns" id="quick-grams">
        <button class="calc-quick-btn" data-gram="1">1 gr</button>
        <button class="calc-quick-btn" data-gram="5">5 gr</button>
        <button class="calc-quick-btn" data-gram="10">10 gr</button>
        <button class="calc-quick-btn" data-gram="25">25 gr</button>
        <button class="calc-quick-btn" data-gram="50">50 gr</button>
        <button class="calc-quick-btn" data-gram="100">100 gr</button>
      </div>

      <div class="calc-info-card" id="calc-info">
        <div class="calc-info-card__row">
          <span class="calc-info-card__label">Anlık Gram Altın</span>
          <span class="calc-info-card__value text-gold" id="info-gram-price">₺0,00</span>
        </div>
        <div class="calc-info-card__row">
          <span class="calc-info-card__label">Seçilen Ayar Çarpanı</span>
          <span class="calc-info-card__value" id="info-karat-mult">×0.9167</span>
        </div>
        <div class="calc-info-card__row">
          <span class="calc-info-card__label">Ayar Bazlı Gram Fiyat</span>
          <span class="calc-info-card__value text-gold" id="info-karat-price">₺0,00</span>
        </div>
        <div class="calc-info-card__row">
          <span class="calc-info-card__label">Altın Değeri</span>
          <span class="calc-info-card__value" id="info-gold-value">₺0,00</span>
        </div>
        <div class="calc-info-card__row">
          <span class="calc-info-card__label">İşçilik</span>
          <span class="calc-info-card__value" id="info-labor">₺0,00</span>
        </div>
      </div>
    </div>
  `;

  let mode = 'gram-to-tl';

  // Tab switch
  document.querySelectorAll('#calc-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#calc-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode;
      document.getElementById('calc-input-area').style.display = mode === 'gram-to-tl' ? 'flex' : 'none';
      document.getElementById('calc-input-area').style.flexDirection = 'column';
      document.getElementById('calc-input-area').style.gap = 'var(--space-4)';
      document.getElementById('calc-tl-area').style.display = mode === 'tl-to-gram' ? 'block' : 'none';
      document.getElementById('quick-grams').style.display = mode === 'gram-to-tl' ? 'flex' : 'none';
      calculate();
    });
  });

  // Quick gram buttons
  document.getElementById('quick-grams').addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-quick-btn');
    if (!btn) return;
    document.getElementById('calc-gram').value = btn.dataset.gram;
    document.querySelectorAll('.calc-quick-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calculate();
  });

  // Input listeners
  ['calc-gram', 'calc-karat', 'calc-labor', 'calc-tl', 'calc-karat2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });

  function calculate() {
    const resultEl = document.getElementById('calc-result');
    const detailEl = document.getElementById('calc-detail');

    if (mode === 'gram-to-tl') {
      const gram = parseFloat(document.getElementById('calc-gram').value) || 0;
      const karat = parseInt(document.getElementById('calc-karat').value);
      const labor = parseFloat(document.getElementById('calc-labor').value) || 0;
      const mult = getKaratMultiplier(karat);
      const karatPrice = currentGramPrice * mult;
      const goldValue = gram * karatPrice;
      const total = goldValue + labor;

      resultEl.textContent = formatCurrency(total);
      detailEl.textContent = gram > 0 ? `${formatNumber(gram)} gr × ${karat} ayar + ${formatCurrency(labor)} işçilik` : 'Değerleri girin';

      document.getElementById('info-karat-mult').textContent = `×${formatNumber(mult, 4)}`;
      document.getElementById('info-karat-price').textContent = formatCurrency(karatPrice);
      document.getElementById('info-gold-value').textContent = formatCurrency(goldValue);
      document.getElementById('info-labor').textContent = formatCurrency(labor);
    } else {
      const tl = parseFloat(document.getElementById('calc-tl').value) || 0;
      const karat = parseInt(document.getElementById('calc-karat2').value);
      const mult = getKaratMultiplier(karat);
      const karatPrice = currentGramPrice * mult;
      const grams = karatPrice > 0 ? tl / karatPrice : 0;

      resultEl.textContent = `${formatNumber(grams)} gram`;
      detailEl.textContent = tl > 0 ? `${formatCurrency(tl)} = ${formatNumber(grams)} gr (${karat} ayar)` : 'Tutarı girin';

      document.getElementById('info-karat-mult').textContent = `×${formatNumber(mult, 4)}`;
      document.getElementById('info-karat-price').textContent = formatCurrency(karatPrice);
      document.getElementById('info-gold-value').textContent = formatCurrency(tl);
      document.getElementById('info-labor').textContent = '₺0,00';
    }
  }

  unsubscribe = onPriceUpdate((prices) => {
    const gram = prices.gram_altin;
    if (gram) {
      currentGramPrice = gram.marginSell;
      document.getElementById('info-gram-price').textContent = formatCurrency(currentGramPrice);
      calculate();
    }
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}
