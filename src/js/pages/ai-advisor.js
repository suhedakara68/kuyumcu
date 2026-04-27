// ============================================
// KUYUMCU PWA — AI Investment Advisor Page
// ============================================
import { fetchCoinData, performAnalysis, getAIAdvice } from '../services/crypto-service.js';
import { formatCurrency } from '../utils/formatters.js';

export function renderAIAdvisor(container) {
  container.innerHTML = `
    <div class="ai-page">
      <div class="ai-hero">
        <div class="ai-hero__badge">AI DANIŞMAN</div>
        <h2 class="ai-hero__title">Akıllı Yatırım Analizi</h2>
        <p class="ai-hero__subtitle">Kripto para piyasalarını teknik analiz ve Yapay Zeka ile yorumlayın.</p>
      </div>

      <div class="section">
        <div class="category-scroll">
          <button class="category-chip active" data-coin="bitcoin">BTC</button>
          <button class="category-chip" data-coin="ethereum">ETH</button>
          <button class="category-chip" data-coin="solana">SOL</button>
          <button class="category-chip" data-coin="ripple">XRP</button>
          <button class="category-chip" data-coin="cardano">ADA</button>
        </div>

        <div id="analysis-container" class="analysis-container">
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Piyasa verileri analiz ediliyor...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const chips = container.querySelectorAll('.category-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadAnalysis(chip.dataset.coin);
    });
  });

  // Initial load
  loadAnalysis('bitcoin');

  async function loadAnalysis(coinId) {
    const display = document.getElementById('analysis-container');
    display.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${coinId.toUpperCase()} analiz ediliyor...</p>
      </div>
    `;

    const data = await fetchCoinData(coinId);
    if (!data) {
      display.innerHTML = '<div class="error-card">⚠️ Veri çekilemedi. Lütfen internet bağlantınızı kontrol edin.</div>';
      return;
    }

    const analysis = performAnalysis(data);
    if (!analysis) {
      display.innerHTML = '<div class="error-card">⚠️ Yeterli veri yok (En az 26 mum gerekli).</div>';
      return;
    }

    const aiResponse = await getAIAdvice(coinId.toUpperCase(), analysis);
    
    // Parse Markdown-like structure from Gemini
    const formattedAI = aiResponse
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold">$1</strong>')
      .replace(/\n/g, '<br>');

    display.innerHTML = `
      <div class="analysis-results stagger">
        <div class="price-banner ${analysis.trend}">
          <div class="price-banner__main">
            <label>Güncel Fiyat (USD)</label>
            <div class="price-banner__value">$${analysis.lastPrice.toLocaleString()}</div>
          </div>
          <div class="price-banner__trend">
            <span class="trend-icon">${analysis.trend === 'bullish' ? '📈' : '📉'}</span>
            <span>${analysis.trend === 'bullish' ? 'YÜKSELİŞ' : 'DÜŞÜŞ'}</span>
          </div>
        </div>

        <div class="tech-grid">
          <div class="tech-card">
            <label>RSI (14)</label>
            <div class="tech-card__value ${analysis.rsi > 70 ? 'danger' : analysis.rsi < 30 ? 'success' : ''}">${analysis.rsi.toFixed(2)}</div>
            <div class="tech-card__label">${analysis.rsi > 70 ? 'Aşırı Alım' : analysis.rsi < 30 ? 'Aşırı Satım' : 'Nötr'}</div>
          </div>
          <div class="tech-card">
            <label>MACD Hist</label>
            <div class="tech-card__value ${analysis.macd.histogram > 0 ? 'success' : 'danger'}">${analysis.macd.histogram.toFixed(4)}</div>
            <div class="tech-card__label">Momentum</div>
          </div>
        </div>

        <div class="ai-advice-card">
          <div class="ai-advice-card__header">
            <span class="ai-icon">✨</span>
            <span>AI Analiz Raporu</span>
          </div>
          <div class="ai-advice-card__content">
            ${formattedAI}
          </div>
        </div>

        <div class="disclaimer">
          ⚠️ <strong>Yasal Uyarı:</strong> Bu analizler sadece bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir.
        </div>
      </div>
    `;
  }
}
