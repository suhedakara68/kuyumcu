// ============================================
// NOVENTRA PWA — Portfolio Service (Firebase Sync)
// ============================================
import { saveData, loadData } from './firebase-service.js';

const STORAGE_KEY = 'noventra_portfolio';

export const ASSET_TYPES = {
  GRAM: { id: 'gram', label: 'Has Altın (Gram)', multiplier: 1, unit: 'gr' },
  BILEZIK_22: { id: 'bilezik_22', label: '22 Ayar Bilezik', multiplier: 0.916, unit: 'gr' },
  KOLYE_14: { id: 'kolye_14', label: '14 Ayar Kolye', multiplier: 0.585, unit: 'gr' },
  CEYREK: { id: 'ceyrek', label: 'Çeyrek Altın', multiplier: 1.6065, unit: 'Adet' },
  YARIM: { id: 'yarim', label: 'Yarım Altın', multiplier: 3.213, unit: 'Adet' },
  TAM: { id: 'tam', label: 'Tam Altın', multiplier: 6.426, unit: 'Adet' },
  ATA: { id: 'ata', label: 'Ata Lira', multiplier: 6.608, unit: 'Adet' }
};

let portfolio = [];

/**
 * Initialize Portfolio from Cloud and Local fallback
 */
export async function initPortfolio() {
  try {
    const cloudData = await loadData('portfolio');
    if (cloudData && cloudData.items) {
      portfolio = cloudData.items;
      saveLocal(); // Sync local with cloud
      console.log('Portföy buluttan yüklendi.');
    } else {
      loadLocal();
    }
  } catch (e) {
    console.warn('Bulut yükleme hatası, yerel veriye dönülüyor:', e);
    loadLocal();
  }
}

export function getPortfolio() {
  return [...portfolio];
}

export async function addAsset(typeId, amount, purchasePrice = 0) {
  const asset = {
    id: Date.now().toString(),
    typeId,
    amount: parseFloat(amount),
    purchasePrice: parseFloat(purchasePrice),
    date: new Date().toISOString()
  };
  
  portfolio.push(asset);
  await savePortfolio();
  return asset;
}

export async function deleteAsset(id) {
  portfolio = portfolio.filter(a => a.id !== id);
  await savePortfolio();
}

export function calculateAssetValue(asset, currentGramPrice) {
  const type = Object.values(ASSET_TYPES).find(t => t.id === asset.typeId);
  if (!type) return 0;
  return asset.amount * type.multiplier * currentGramPrice;
}

export function calculateTotalValue(currentGramPrice) {
  return portfolio.reduce((sum, asset) => sum + calculateAssetValue(asset, currentGramPrice), 0);
}

/**
 * Save to both Local and Cloud
 */
async function savePortfolio() {
  saveLocal();
  try {
    await saveData('portfolio', { items: portfolio, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('Buluta kaydedilemedi:', e);
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function loadLocal() {
  const data = localStorage.getItem(STORAGE_KEY);
  portfolio = data ? JSON.parse(data) : [];
}
