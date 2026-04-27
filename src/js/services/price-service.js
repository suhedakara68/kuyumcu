// ============================================
// NOVENTRA PWA — Price Service
// ============================================
import { saveGlobalData, loadGlobalData } from './firebase-service.js';

const API_URL = 'https://finans.truncgil.com/today.json';
const listeners = [];
let prices = {};
let margins = {};
let intervalId = null;
let apiAvailable = false;

// ─── Key Mapping ───
const GOLD_MAP = {
  'gram-altin':      { key: 'gram_altin',   name: 'Gram Altın',       icon: '🥇', unit: '₺/gr' },
  'ceyrek-altin':    { key: 'ceyrek_altin', name: 'Çeyrek Altın',     icon: '🪙', unit: '₺/adet' },
  'yarim-altin':     { key: 'yarim_altin',  name: 'Yarım Altın',      icon: '🏅', unit: '₺/adet' },
  'tam-altin':       { key: 'tam_altin',    name: 'Tam Altın',         icon: '💰', unit: '₺/adet' },
  '22-ayar-bilezik': { key: 'bilezik_22',   name: '22 Ayar Bilezik',   icon: '💎', unit: '₺/gr' },
  'ata-altin':       { key: 'ata_altin',    name: 'Ata Altın',         icon: '🏛️', unit: '₺/adet' },
};

const CURRENCY_MAP = {
  'USD': { key: 'usd_try', name: 'USD/TRY', icon: '💵', unit: '₺' },
  'EUR': { key: 'eur_try', name: 'EUR/TRY', icon: '💶', unit: '₺' },
  'GBP': { key: 'gbp_try', name: 'GBP/TRY', icon: '💷', unit: '₺' },
};

const DEFAULT_MARGINS = {
  gram_altin:   { buyMargin: -1.5, sellMargin: 1.5 },
  ceyrek_altin: { buyMargin: -2.0, sellMargin: 2.0 },
  yarim_altin:  { buyMargin: -2.0, sellMargin: 2.0 },
  tam_altin:    { buyMargin: -2.0, sellMargin: 2.0 },
  bilezik_22:   { buyMargin: -1.5, sellMargin: 1.5 },
  ata_altin:    { buyMargin: -2.5, sellMargin: 2.5 },
  usd_try:      { buyMargin: -0.5, sellMargin: 0.5 },
  eur_try:      { buyMargin: -0.5, sellMargin: 0.5 },
  gbp_try:      { buyMargin: -0.5, sellMargin: 0.5 },
};

function parseTurkishNumber(str) {
  if (!str || typeof str !== 'string') return 0;
  str = str.replace('$', '').trim();
  str = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

function parseChange(str) {
  if (!str || typeof str !== 'string') return 0;
  str = str.replace('%', '').replace(',', '.');
  return parseFloat(str) || 0;
}

async function loadMargins() {
  try {
    const cloudData = await loadGlobalData('margins');
    if (cloudData) {
      margins = { ...DEFAULT_MARGINS, ...cloudData };
    } else {
      const saved = localStorage.getItem('noventra_margins');
      margins = saved ? JSON.parse(saved) : { ...DEFAULT_MARGINS };
    }
  } catch (e) {
    margins = { ...DEFAULT_MARGINS };
  }
}

export async function saveMargins(newMargins) {
  margins = { ...margins, ...newMargins };
  localStorage.setItem('noventra_margins', JSON.stringify(margins));
  await saveGlobalData('margins', margins);
  recalcPrices();
}

export function getMargins() {
  return { ...margins };
}

async function fetchFromAPI() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    apiAvailable = true;
    return data;
  } catch (error) {
    apiAvailable = false;
    return null;
  }
}

function processApiData(apiData) {
  const now = new Date();
  const prevPrices = { ...prices };

  [...Object.entries(GOLD_MAP), ...Object.entries(CURRENCY_MAP)].forEach(([apiKey, meta]) => {
    const item = apiData[apiKey];
    if (!item) return;

    const buy = parseTurkishNumber(item['Alış']);
    const sell = parseTurkishNumber(item['Satış']);
    const change = parseChange(item['Değişim']);
    const prevBuy = prevPrices[meta.key]?.buy || buy;
    const m = margins[meta.key] || DEFAULT_MARGINS[meta.key] || { buyMargin: 0, sellMargin: 0 };

    prices[meta.key] = {
      key: meta.key,
      name: meta.name,
      icon: meta.icon,
      unit: meta.unit,
      buy,
      sell,
      prevBuy,
      prevSell: prevPrices[meta.key]?.sell || sell,
      marginBuy: buy * (1 + m.buyMargin / 100),
      marginSell: sell * (1 + m.sellMargin / 100),
      buyMargin: m.buyMargin,
      sellMargin: m.sellMargin,
      change,
      direction: buy > prevBuy ? 'up' : buy < prevBuy ? 'down' : 'stable',
      updatedAt: now,
      source: 'api'
    };
  });
}

function recalcPrices() {
  Object.keys(prices).forEach(key => {
    const p = prices[key];
    const m = margins[key] || DEFAULT_MARGINS[key] || { buyMargin: 0, sellMargin: 0 };
    p.marginBuy = p.buy * (1 + m.buyMargin / 100);
    p.marginSell = p.sell * (1 + m.sellMargin / 100);
    p.buyMargin = m.buyMargin;
    p.sellMargin = m.sellMargin;
  });
  notifyListeners();
}

const FALLBACK_PRICES = {
  gram_altin:   { name: 'Gram Altın', icon: '🥇', buy: 2500, sell: 2510, unit: '₺/gr' },
  usd_try:      { name: 'USD/TRY', icon: '💵', buy: 32.50, sell: 32.60, unit: '₺' },
  eur_try:      { name: 'EUR/TRY', icon: '💶', buy: 35.10, sell: 35.20, unit: '₺' },
};

function useSimulatedData() {
  const now = new Date();
  const prevPrices = { ...prices };
  Object.entries(FALLBACK_PRICES).forEach(([key, base]) => {
    const prevBuy = prevPrices[key]?.buy || base.buy;
    const buy = prevBuy + (Math.random() - 0.5) * 5;
    const sell = buy + 10;
    const m = margins[key] || DEFAULT_MARGINS[key] || { buyMargin: 0, sellMargin: 0 };
    prices[key] = {
      key, name: base.name, icon: base.icon, unit: base.unit, buy, sell, prevBuy,
      marginBuy: buy * (1 + m.buyMargin / 100),
      marginSell: sell * (1 + m.sellMargin / 100),
      updatedAt: now, source: 'simulated', direction: buy > prevBuy ? 'up' : 'down'
    };
  });
}

async function updatePrices() {
  const apiData = await fetchFromAPI();
  if (apiData) processApiData(apiData);
  else useSimulatedData();
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach(fn => fn({ ...prices }));
}

export function onPriceUpdate(callback) {
  listeners.push(callback);
  if (Object.keys(prices).length > 0) callback({ ...prices });
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export async function startPriceSimulation(intervalMs = 30000) {
  await loadMargins();
  await updatePrices();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(updatePrices, intervalMs);
}

export function stopPriceSimulation() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

export function getCurrentPrices() {
  return { ...prices };
}

export function getPrice(key) {
  return prices[key] || null;
}

export function isApiConnected() { return apiAvailable; }
export const GOLD_KEYS = ['gram_altin', 'ceyrek_altin', 'yarim_altin', 'tam_altin', 'bilezik_22', 'ata_altin'];
export const CURRENCY_KEYS = ['usd_try', 'eur_try', 'gbp_try'];
export const ALL_GOLD_KEYS = ['gram_altin', 'ceyrek_altin', 'yarim_altin', 'tam_altin', 'bilezik_22', 'ata_altin'];
