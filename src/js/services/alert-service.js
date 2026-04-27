// ============================================
// NOVENTRA PWA — Alert Service
// ============================================
import { saveData, loadData } from './firebase-service.js';
import { notifyPriceAlert } from './notification-service.js';

const STORAGE_KEY = 'noventra_alerts';
let alerts = [];
let triggerCallback = null;

export async function initAlerts() {
  try {
    const cloudData = await loadData('alerts');
    if (cloudData && cloudData.items) {
      alerts = cloudData.items;
      saveAlertsToStorage();
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      alerts = saved ? JSON.parse(saved) : [];
    }
  } catch (e) {
    const saved = localStorage.getItem(STORAGE_KEY);
    alerts = saved ? JSON.parse(saved) : [];
  }
}

export function getAlerts() {
  return [...alerts];
}

export function addAlert(alert) {
  const newAlert = {
    id: Date.now().toString(),
    symbol: alert.symbol,
    label: alert.label,
    targetPrice: parseFloat(alert.targetPrice),
    condition: alert.condition,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  alerts.push(newAlert);
  saveAlerts();
  
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  return newAlert;
}

export function deleteAlert(id) {
  alerts = alerts.filter(a => a.id !== id);
  saveAlerts();
}

export function toggleAlert(id) {
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.isActive = !alert.isActive;
    saveAlerts();
  }
}

function saveAlerts() {
  saveAlertsToStorage();
  saveData('alerts', { items: alerts, updatedAt: new Date() });
  
  // Sync with our backend server for offline tracking
  const backendUrl = `http://${window.location.hostname}:5000/sync-alerts`;
  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify({ alerts }),
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.warn('Sunucu senkronizasyon hatası:', err));
}

function saveAlertsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function checkAlerts(currentPrices) {
  let triggeredCount = 0;
  
  alerts.forEach(alert => {
    if (!alert.isActive) return;
    
    const priceData = currentPrices[alert.symbol];
    if (!priceData) return;
    
    const currentPrice = priceData.marginSell;
    let triggered = false;
    
    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      triggered = true;
    }
    
    if (triggered) {
      notifyPriceAlert(alert, currentPrice);
      if (triggerCallback) triggerCallback(alert, currentPrice);
      alert.isActive = false;
      triggeredCount++;
    }
  });
  
  if (triggeredCount > 0) saveAlerts();
}

// Internal helper removed in favor of notification-service.js


export function onAlertTrigger(callback) {
  triggerCallback = callback;
}

export function updateAlertBadge() {
  const badge = document.getElementById('alert-badge');
  if (!badge) return;
  const count = alerts.filter(a => a.isActive).length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

