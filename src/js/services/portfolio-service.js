// ============================================
// NOVENTRA PWA — Portfolio Service
// ============================================
import { saveData, loadData } from './firebase-service.js';
import { updateGoalProgress } from './goal-service.js';

const STORAGE_KEY = 'noventra_portfolio';
let assets = [];

export async function initPortfolio() {
  // Load from cloud and merge
  const cloudData = await loadData('portfolios');
  if (cloudData && cloudData.items) {
    assets = cloudData.items;
    savePortfolio();
  } else {
    const saved = localStorage.getItem(STORAGE_KEY);
    assets = saved ? JSON.parse(saved) : [];
  }
}

export function getAssets() {
  return [...assets];
}

export function getPortfolio() {
  return getAssets();
}


export function addAsset(asset) {
  const newAsset = {
    id: Date.now().toString(),
    symbol: asset.symbol,     // 'gram_altin', 'usd_try' etc.
    label: asset.label,
    amount: parseFloat(asset.amount),
    buyPrice: parseFloat(asset.buyPrice),
    date: asset.date || new Date().toISOString()
  };
  
  assets.push(newAsset);
  savePortfolio();
  return newAsset;
}

export function deleteAsset(id) {
  assets = assets.filter(a => a.id !== id);
  savePortfolio();
}

export function calculateSummary(currentPrices) {
  let totalValue = 0;
  let totalCost = 0;
  
  const detailedAssets = assets.map(asset => {
    const priceData = currentPrices[asset.symbol];
    const currentPrice = priceData ? priceData.marginSell : 0;
    const value = asset.amount * currentPrice;
    const cost = asset.amount * asset.buyPrice;
    const profit = value - cost;
    const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
    
    totalValue += value;
    totalCost += cost;
    
    return {
      ...asset,
      currentPrice,
      value,
      cost,
      profit,
      profitPercent
    };
  });
  
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  return {
    assets: detailedAssets,
    totalValue,
    totalCost,
    totalProfit,
    totalProfitPercent
  };
}

function savePortfolio() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  saveData('portfolios', { items: assets, updatedAt: new Date() });
  
  // Update goals based on new assets
  const goldAssets = assets.filter(a => a.symbol === 'gram_altin' || a.symbol === 'ceyrek_altin' || a.symbol === 'bilezik_22' || a.symbol === 'ata_altin');
  updateGoalProgress(goldAssets.map(a => ({ type: 'gold', amount: a.amount })));
}
