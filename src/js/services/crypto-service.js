// ============================================
// KUYUMCU PWA — Crypto & AI Analysis Service
// ============================================
import { RSI, MACD, EMA, BollingerBands } from 'technicalindicators';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/** Fetch OHLC data for a coin (e.g., 'bitcoin') */
export async function fetchCoinData(coinId = 'bitcoin', days = 30) {
  try {
    const response = await fetch(`${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`);
    if (!response.ok) throw new Error('CoinGecko API error');
    const data = await response.json();
    
    // Format: [timestamp, open, high, low, close]
    return data.map(d => ({
      time: d[0],
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4]
    }));
  } catch (error) {
    console.error('Crypto data fetch error:', error);
    return null;
  }
}

/** Perform Technical Analysis on price data */
export function performAnalysis(ohlcData) {
  if (!ohlcData || ohlcData.length < 26) return null;

  const closes = ohlcData.map(d => d.close);
  
  // RSI (14)
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  const currentRSI = rsiValues[rsiValues.length - 1];

  // MACD
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const currentMACD = macdValues[macdValues.length - 1];

  // EMA (20)
  const ema20Values = EMA.calculate({ values: closes, period: 20 });
  const currentEMA = ema20Values[ema20Values.length - 1];

  // Bollinger Bands
  const bbValues = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
  const currentBB = bbValues[bbValues.length - 1];

  return {
    rsi: currentRSI,
    macd: currentMACD,
    ema: currentEMA,
    bb: currentBB,
    lastPrice: closes[closes.length - 1],
    trend: closes[closes.length - 1] > currentEMA ? 'bullish' : 'bearish'
  };
}

/** Get AI Recommendation from Gemini */
export async function getAIAdvice(coinName, analysisData) {
  if (!GEMINI_API_KEY) return "AI API Anahtarı bulunamadı. Lütfen .env dosyasına VITE_GEMINI_API_KEY ekleyin.";

  const prompt = `
    Sen profesyonel bir kripto para yatırım danışmanısın. 
    Aşağıdaki teknik analiz verilerini kullanarak ${coinName} için kısa ve öz bir piyasa özeti ve yatırım tavsiyesi ver.
    
    Teknik Veriler:
    - Son Fiyat: $${analysisData.lastPrice}
    - RSI (14): ${analysisData.rsi.toFixed(2)} (${analysisData.rsi > 70 ? 'Aşırı Alım' : analysisData.rsi < 30 ? 'Aşırı Satım' : 'Nötr'})
    - MACD: Histogram ${analysisData.macd.histogram.toFixed(4)}, Sinyal ${analysisData.macd.signal.toFixed(4)}
    - Trend: ${analysisData.trend === 'bullish' ? 'Yükseliş Eğilimi' : 'Düşüş Eğilimi'}
    - Bollinger Bands: Üst: ${analysisData.bb.upper.toFixed(2)}, Alt: ${analysisData.bb.lower.toFixed(2)}

    Lütfen şu formatta cevap ver:
    1. **Piyasa Özeti**: (1 cümle)
    2. **Risk Skoru**: (1-10 arası)
    3. **Tavsiye**: (Al/Sat/Bekle ve nedeni)
    4. **Hedef Seviyeler**: (Destek ve Direnç)
    
    Yanıtın tamamen Türkçe ve profesyonel olsun.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return `AI Hatası: ${data.error.message}`;
    }
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini Fetch Error:', error);
    return "AI Analizi şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.";
  }
}

/** Ana sayfa için kısa piyasa özeti üretir */
export async function getMarketInsight(prices) {
  if (!GEMINI_API_KEY) return "Piyasa şu an stabil görünüyor.";

  const prompt = `
    Aşağıdaki anlık fiyat verilerini analiz et ve bir kuyumcu müşterisi için 2 cümleyi geçmeyen, 
    çok kısa ve çarpıcı bir piyasa özeti yaz. Trend yukarı mı aşağı mı belirt. Emojiler kullan.
    
    Veriler:
    - Gram Altın: ${prices.gram_altin?.marginSell} TL
    - USD/TRY: ${prices.usd_try?.marginSell} TL
    - EUR/TRY: ${prices.eur_try?.marginSell} TL
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0.7 }
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "Altın ve döviz piyasası hareketli. Detaylı analiz için AI sayfasına göz atın. 📈";
  }
}
