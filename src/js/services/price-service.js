// ============================================
// NOVENTRA PWA — Price Service (Clean & Safe)
// ============================================
import { saveData, loadData } from './firebase-service.js';

const API_URL = 'https://finans.truncgil.com/today.json';
const listeners = [];
let prices = {};
let margins = {};
let intervalId = null;
let apiAvailable = false;
const history = {};

const GOLD_MAP = {
  'gram-altin':      { key: 'gram_altin',   name: 'Gram Altın', icon: '', unit: '₺/gr' },
  'ceyrek-altin':    { key: 'ceyrek_altin', name: 'Çeyrek Altın', icon: '', unit: '₺/adet' },
  'yarim-altin':     { key: 'yarim_altin',  name: 'Yarım Altın', icon: '', unit: '₺/adet' },
  'tam-altin':       { key: 'tam_altin',    name: 'Tam Altın', icon: '', unit: '₺/adet' },
  '22-ayar-bilezik': { key: 'bilezik_22',   name: '22 Ayar Bilezik', icon: '', unit: '₺/gr' },
  'ata-altin':       { key: 'ata_altin',    name: 'Ata Altın', icon: '', unit: '₺/adet' },
};

const CURRENCY_MAP = {
  'USD': { key: 'usd_try', name: 'USD/TRY', icon: '', unit: '₺' },
  'EUR': { key: 'eur_try', name: 'EUR/TRY', icon: '', unit: '₺' }
};

const DEFAULT_MARGINS = {
  gram_altin: { buyMargin: -1, sellMargin: 1 },
  usd_try: { buyMargin: -0.5, sellMargin: 0.5 },
  eur_try: { buyMargin: -0.5, sellMargin: 0.5 }
};

function parseTR(str) {
  if (!str || typeof str !== 'string') return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

export function getPriceHistory(key) {
  if (!history[key]) generateHistory(key, prices[key]?.marginSell || 2500);
  return history[key] || [];
}

function generateHistory(key, base) {
  history[key] = [];
  let lp = base;
  const now = Math.floor(Date.now() / 1000);
  for (let i = 50; i > 0; i--) {
    const o = lp + (Math.random() - 0.5) * 5;
    history[key].push({ time: now - (i * 60), open: o, high: o + 2, low: o - 2, close: lp });
    lp = o;
  }
}

async function updatePrices() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    apiAvailable = true;
    
    Object.entries(GOLD_MAP).concat(Object.entries(CURRENCY_MAP)).forEach(([apiK, meta]) => {
      const item = data[apiK];
      if (!item) return;
      const b = parseTR(item['Alış']);
      const s = parseTR(item['Satış']);
      const m = margins[meta.key] || DEFAULT_MARGINS[meta.key] || { buyMargin: 0, sellMargin: 0 };
      
      prices[meta.key] = {
        key: meta.key,
        name: meta.name,
        buy: b, sell: s,
        marginBuy: b * (1 + m.buyMargin/100),
        marginSell: s * (1 + m.sellMargin/100),
        direction: b > (prices[meta.key]?.buy || b) ? 'up' : 'down',
        updatedAt: new Date()
      };
      
      // Update history
      if (!history[meta.key]) generateHistory(meta.key, b);
      const last = history[meta.key][history[meta.key].length - 1];
      const nowTs = Math.floor(Date.now() / 1000);
      if (nowTs - last.time > 60) {
        history[meta.key].push({ time: nowTs, open: last.close, high: Math.max(last.close, b), low: Math.min(last.close, b), close: b });
        if (history[meta.key].length > 100) history[meta.key].shift();
      }
    });
  } catch (e) {
    apiAvailable = false;
    // Simple fallback
    Object.keys(DEFAULT_MARGINS).forEach(k => {
      const b = 2500 + (Math.random() - 0.5) * 10;
      prices[k] = { key: k, name: k, buy: b, sell: b + 10, marginBuy: b, marginSell: b + 10, direction: 'up', updatedAt: new Date() };
    });
  }
  listeners.forEach(fn => fn({ ...prices }));
}

export function onPriceUpdate(cb) {
  listeners.push(cb);
  if (Object.keys(prices).length > 0) cb({ ...prices });
  return () => { const idx = listeners.indexOf(cb); if (idx > -1) listeners.splice(idx, 1); };
}

export async function startPriceSimulation(ms = 30000) {
  const m = await loadData('margins');
  margins = m || { ...DEFAULT_MARGINS };
  await updatePrices();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(updatePrices, ms);
}

export function getCurrentPrices() { return { ...prices }; }
export const GOLD_KEYS = ['gram_altin', 'ceyrek_altin', 'yarim_altin', 'tam_altin', 'bilezik_22', 'ata_altin'];
export const CURRENCY_KEYS = ['usd_try', 'eur_try'];
export function isApiConnected() { return apiAvailable; }
