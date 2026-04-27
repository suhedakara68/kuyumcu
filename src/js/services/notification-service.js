// ============================================
// NOVENTRA PWA — Notification Service
// ============================================

export function initNotifications() {
  if (!('Notification' in window)) return;
  console.log('Bildirim servisi hazır.');
}

export function getNotificationPermission() {
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BGZbem60HnGA9RUHPbymQ1sKuoO22VXEMZJpLziEq56_vbZ-v1JyckB4KLpmfdvF7j_p4CtZXbAN40RF45lehiM'
    });
    
    const backendUrl = `http://${window.location.hostname}:5000/subscribe`;
    await fetch(backendUrl, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return permission === 'granted';
}

export function showNotification(title, options = {}) {
  const defaultOptions = {
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    ...options
  };

  // If app is open and notification permission is granted
  if (Notification.permission === 'granted') {
    // Try to use Service Worker registration for background support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      // Fallback to basic notification
      new Notification(title, defaultOptions);
    }
  }
}

export function notifyPriceAlert(alert, actualPrice) {
  const title = `🚨 Fiyat Alarmı: ${alert.label}`;
  const body = `${alert.label} fiyatı ${actualPrice.toFixed(2)} ₺ seviyesine ulaştı! Hedefiniz: ${alert.targetPrice} ₺`;
  
  showNotification(title, {
    body,
    tag: `alert-${alert.id}`,
    renotify: true
  });
}
