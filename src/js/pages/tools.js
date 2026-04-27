// ============================================
// NOVENTRA PWA — Tools & Calculator Page
// ============================================
import { onPriceUpdate } from '../services/price-service.js';
import { getPortfolio } from '../services/portfolio-service.js';
import { formatCurrency, formatNumber, getKaratMultiplier } from '../utils/formatters.js';
import { requestNotificationPermission, getNotificationPermission } from '../services/notification-service.js';

let unsubscribe = null;
let currentGramPrice = 0;

export function renderTools(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2 class="page__title">🛠️ Araçlar</h2>
      <p class="page__subtitle">Hızlı hesaplama ve finansal araçlar</p>
    </div>

    <div class="calc-display glow-gold">
      <div class="calc-display__label">Hesaplanan Tutar</div>
      <div class="calc-display__value" id="calc-result">₺0,00</div>
      <div class="calc-display__sub" id="calc-detail">Değerleri girin</div>
    </div>

    <div class="card card-gold">
      <div class="tabs" id="calc-tabs" style="margin-bottom:var(--space-4);">
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

        <div class="input-group" style="margin-top:var(--space-4);">
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

      <div class="calc-quick-btns" id="quick-grams" style="margin-top:var(--space-4);">
        <button class="calc-quick-btn" data-gram="1">1g</button>
        <button class="calc-quick-btn" data-gram="5">5g</button>
        <button class="calc-quick-btn" data-gram="10">10g</button>
        <button class="calc-quick-btn" data-gram="20">20g</button>
      </div>
    </div>

    <!-- Zakat Calculator -->
    <div class="card card-dark" style="margin-top:var(--space-6); border:1px solid rgba(16,185,129,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
        <h3 style="font-size:var(--font-size-md); display:flex; align-items:center; gap:var(--space-2);">
          <span>🕌</span> Zekat Hesaplayıcı
        </h3>
        <span class="badge badge-success">Otomatik</span>
      </div>
      
      <p style="font-size:var(--font-size-xs); color:var(--text-muted); margin-bottom:var(--space-4);">
        Diyanet nisap miktarı (80.18 gr) baz alınarak portföyünüz üzerinden hesaplanır.
      </p>

      <div class="zakat-box" style="background:rgba(16,185,129,0.05); padding:var(--space-4); border-radius:var(--radius-md); border:1px dashed var(--color-success);">
        <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-2);">
          <span style="font-size:var(--font-size-sm);">Toplam Zekata Tabi Altın:</span>
          <span id="zakat-gold-amount" style="font-weight:600;">0.00 gr</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:var(--space-2);">
          <span style="font-size:var(--font-size-sm); color:var(--color-success);">Ödenmesi Gereken Zekat:</span>
          <span id="zakat-amount-tl" style="font-weight:bold; color:var(--color-success);">₺0,00</span>
        </div>
      </div>
    </div>

    <div class="calc-info-card" style="margin-top:var(--space-4);">
       <div style="display:flex; justify-content:space-between; font-size:var(--font-size-xs); color:var(--text-muted);">
         <span>Canlı Gram Fiyatı:</span>
         <span id="info-gram-price" class="text-gold">₺0,00</span>
       </div>
    </div>

    <!-- Notification Settings -->
    <div class="card" style="margin-top:var(--space-6); background:rgba(212,168,83,0.05); border:1px solid rgba(212,168,83,0.2);">
      <h3 style="font-size:var(--font-size-md); margin-bottom:var(--space-2); display:flex; align-items:center; gap:var(--space-2);">
        <span>🔔</span> Bildirim Ayarları
      </h3>
      <p style="font-size:var(--font-size-xs); color:var(--text-muted); margin-bottom:var(--space-4);">
        Fiyat alarmlarını ve önemli piyasa haberlerini anlık bildirim olarak alabilirsiniz.
      </p>
      
      <div id="notification-status-box">
        <!-- Injected via JS -->
      </div>
    </div>
  `;

  updateNotificationUI();

  async function updateNotificationUI() {
    const box = document.getElementById('notification-status-box');
    if (!box) return;

    const status = getNotificationPermission();

    if (status === 'granted') {
      box.innerHTML = `
        <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--color-success); font-size:var(--font-size-sm); font-weight:600;">
          <span>✅</span> Bildirimler Aktif
        </div>
      `;
    } else if (status === 'denied') {
      box.innerHTML = `
        <div style="color:var(--color-danger); font-size:var(--font-size-sm);">
          <p>❌ Bildirimler tarayıcı tarafından engellendi.</p>
          <small>Tekrar açmak için tarayıcı ayarlarından izin vermeniz gerekiyor.</small>
        </div>
      `;
    } else {
      box.innerHTML = `
        <button class="btn btn-gold btn-block" id="enable-notifications-btn">Bildirimleri Etkinleştir</button>
      `;
      document.getElementById('enable-notifications-btn')?.addEventListener('click', async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
          updateNotificationUI();
        } else {
          alert('Bildirim izni verilmedi. Ayarlardan manuel olarak açabilirsiniz.');
        }
      });
    }
  }

  let mode = 'gram-to-tl';

  // Tab switch
  document.querySelectorAll('#calc-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#calc-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode;
      document.getElementById('calc-input-area').style.display = mode === 'gram-to-tl' ? 'block' : 'none';
      document.getElementById('calc-tl-area').style.display = mode === 'tl-to-gram' ? 'block' : 'none';
      calculate();
    });
  });

  // Quick grams
  document.getElementById('quick-grams').addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-quick-btn');
    if (!btn) return;
    document.getElementById('calc-gram').value = btn.dataset.gram;
    calculate();
  });

  // Listeners
  ['calc-gram', 'calc-karat', 'calc-labor', 'calc-tl', 'calc-karat2'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculate);
  });

  function calculate() {
    const resultEl = document.getElementById('calc-result');
    const detailEl = document.getElementById('calc-detail');
    if (!resultEl) return;

    // Standard Calculator Logic
    if (mode === 'gram-to-tl') {
      const gram = parseFloat(document.getElementById('calc-gram').value) || 0;
      const karat = parseInt(document.getElementById('calc-karat').value);
      const labor = parseFloat(document.getElementById('calc-labor').value) || 0;
      const mult = getKaratMultiplier(karat);
      const total = (gram * currentGramPrice * mult) + labor;

      resultEl.textContent = formatCurrency(total);
      detailEl.textContent = `${gram} gr × ${karat} Ayar + İşçilik`;
    } else {
      const tl = parseFloat(document.getElementById('calc-tl').value) || 0;
      const karat = parseInt(document.getElementById('calc-karat2').value);
      const mult = getKaratMultiplier(karat);
      const grams = (currentGramPrice * mult) > 0 ? tl / (currentGramPrice * mult) : 0;

      resultEl.textContent = `${formatNumber(grams, 2)} gr`;
      detailEl.textContent = `${formatCurrency(tl)} Karşılığı (${karat} Ayar)`;
    }

    // Zakat Logic
    updateZakat();
  }

  function updateZakat() {
    const goldAmountEl = document.getElementById('zakat-gold-amount');
    const zakatTlEl = document.getElementById('zakat-amount-tl');
    if (!goldAmountEl || !zakatTlEl) return;

    const portfolio = getPortfolio();
    // Only gold assets are subject to zakat in this simple calculator
    const goldAssets = portfolio.filter(a => a.type === 'gram_altin' || a.type === 'ceyrek_altin');
    
    let total24kGrams = 0;
    goldAssets.forEach(a => {
      const mult = getKaratMultiplier(a.karat);
      total24kGrams += a.amount * mult;
    });

    const NISAP_LIMIT = 80.18;
    goldAmountEl.textContent = `${formatNumber(total24kGrams, 2)} gr`;

    if (total24kGrams >= NISAP_LIMIT) {
      const zakatGrams = total24kGrams / 40; // 1/40 ratio
      const zakatTl = zakatGrams * currentGramPrice;
      zakatTlEl.textContent = formatCurrency(zakatTl);
    } else {
      zakatTlEl.textContent = 'Nisap Altında (₺0)';
    }
  }

  unsubscribe = onPriceUpdate((prices) => {
    if (prices.gram_altin) {
      currentGramPrice = prices.gram_altin.marginSell;
      document.getElementById('info-gram-price').textContent = formatCurrency(currentGramPrice);
      calculate();
    }
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}
