// ============================================
// NOVENTRA PWA — Main Entry Point (Bulletproof Version)
// ============================================

console.log('🚀 NOVENTRA: Uygulama yükleniyor...');

import { initRouter, handleRoute, navigate, registerRoute } from './js/router.js';
import { startPriceSimulation, onPriceUpdate } from './js/services/price-service.js';
import { initAlerts, checkAlerts, updateAlertBadge, onAlertTrigger } from './js/services/alert-service.js';
import { renderHome } from './js/pages/home.js';
import { renderPortfolio } from './js/pages/portfolio.js';
import { renderTools } from './js/pages/tools.js';
import { renderProducts } from './js/pages/products.js';
import { renderAlerts } from './js/pages/alerts.js';
import { renderOrders } from './js/pages/orders.js';
import { renderAdminLogin } from './js/pages/admin/login.js';
import { renderAdminDashboard } from './js/pages/admin/dashboard.js';
import { renderAdminPricing } from './js/pages/admin/pricing.js';
import { renderAdminStock } from './js/pages/admin/stock.js';
import { renderAdminOrders } from './js/pages/admin/orders.js';
import { renderAdminPriceCard } from './js/pages/admin/price-card.js';


import { initProducts } from './js/services/product-service.js';
import { initOrders } from './js/services/order-service.js';
import { initPortfolio } from './js/services/portfolio-service.js';
import { initGoals } from './js/services/goal-service.js';
import { initNotifications } from './js/services/notification-service.js';
import { showInstallGuide } from './js/components/install-guide.js';
import { initFirebaseAuth } from './js/services/firebase-service.js';

import './css/variables.css';
import './css/base.css';
import './css/layout.css';
import './css/components.css';
import './css/pages.css';
import './css/animations.css';

/**
 * Builds the basic application layout
 */
function buildAppShell() {
  console.log('🏗️ NOVENTRA: App Shell oluşturuluyor...');
  const app = document.getElementById('app');
  if (!app) {
    console.error('❌ KRİTİK HATA: #app elementi bulunamadı!');
    return;
  }

  app.innerHTML = `
    <header class="header">
      <div class="header__brand">
        <div class="header__logo">
          <img src="/logo.png" alt="N" style="height:24px; width:24px;">
        </div>
        <div class="header__title-group">
          <h1 class="header__title">NOVENTRA</h1>
          <span class="header__subtitle">Kuyumcu Canlı Ekran</span>
        </div>
      </div>
      <div class="header__actions">
        <button class="header__btn" id="btn-notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="header__badge" id="alert-badge" style="display:none;">0</span>
        </button>
        <button class="header__btn" id="btn-admin">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        </button>
      </div>
    </header>

    <main id="page-content" class="page"></main>

    <nav class="bottom-nav">
      <div class="bottom-nav__container">
        <button class="nav-item active" data-route="/" id="nav-home">
          <span class="nav-item__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          <span class="nav-item__label">Piyasa</span>
        </button>
        <button class="nav-item" data-route="/portfolio" id="nav-portfolio">
          <span class="nav-item__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></span>
          <span class="nav-item__label">Varlıklarım</span>
        </button>

        <button class="nav-item" data-route="/products" id="nav-products">
          <span class="nav-item__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>
          <span class="nav-item__label">Katalog</span>
        </button>
        <button class="nav-item" data-route="/tools" id="nav-tools">
          <span class="nav-item__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span class="nav-item__label">Araçlar</span>
        </button>
      </div>
    </nav>

    <div id="toast-container" class="toast-container"></div>
  `;

  // UI Event Listeners
  document.getElementById('btn-notifications')?.addEventListener('click', () => navigate('/alerts'));
  document.getElementById('btn-admin')?.addEventListener('click', () => navigate('/admin'));

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}

/**
 * Global App Initialization
 */
async function init() {
  console.log('🏁 NOVENTRA: Başlatma dizisi başladı...');
  
  try {
    // 1. Build Shell immediately
    buildAppShell();
    
    // 2. Register Routes
    initRouterConfig();

    // 3. Initialize Services with safety
    console.log('📡 Servisler yükleniyor...');
    
    // Auth and Data loading in parallel with timeouts
    const servicePromises = [
      safeInit('Auth', initFirebaseAuth),
      safeInit('Ürünler', initProducts),
      safeInit('Siparişler', initOrders),
      safeInit('Portföy', initPortfolio),
      safeInit('Alarmlar', initAlerts),
      safeInit('Hedefler', initGoals),
      safeInit('Bildirimler', initNotifications)
    ];

    await Promise.all(servicePromises);
    console.log('✅ Tüm servisler hazır (veya fallback modda).');

    // 4. Start Price Simulation
    startPriceSimulation(30000);
    
    // 5. Setup Live Update Handlers
    onPriceUpdate((prices) => {
      checkAlerts(prices);
      updateAlertBadge();
    });

    onAlertTrigger((alert, actualPrice) => {
      showAlarmToast(alert, actualPrice);
      updateAlertBadge();
    });

    // 6. Final UI Check
    const contentEl = document.getElementById('page-content');
    if (contentEl) {
      initRouter(contentEl);
      console.log('🚀 NOVENTRA: Router başlatıldı, uygulama yayında!');
    } else {
      throw new Error('#page-content bulunamadı');
    }

    // 7. Register Service Worker for Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('🔔 Service Worker kayıtlı (Bildirimler hazır).'))
        .catch(err => console.error('❌ SW Kayıt Hatası:', err));
    }


    // 7. Check PWA Install
    setTimeout(showInstallGuide, 3000);

  } catch (error) {
    console.error('❌ KRİTİK BAŞLATMA HATASI:', error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="padding:40px; text-align:center; color:white; background:#0A0A14; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
          <h2 style="color:var(--color-gold); margin-bottom:16px;">Bir Hata Oluştu</h2>
          <p style="color:#8B8BA7; margin-bottom:24px;">Uygulama başlatılamadı. Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</p>
          <button onclick="location.reload()" style="background:var(--color-gold); color:black; padding:12px 24px; border-radius:8px; font-weight:bold;">Yeniden Dene</button>
          <pre style="margin-top:24px; font-size:10px; color:#555;">${error.message}</pre>
        </div>
      `;
    }
  }
}

/**
 * Safe Service Initializer
 */
async function safeInit(name, initFn) {
  try {
    console.log(`- ${name} başlatılıyor...`);
    // 5 second timeout for each service
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} zaman aşımı`)), 5000));
    await Promise.race([initFn(), timeout]);
    console.log(`  [OK] ${name}`);
  } catch (e) {
    console.warn(`⚠️ ${name} yüklenemedi (Fallback kullanılıyor):`, e.message);
  }
}

function initRouterConfig() {
    registerRoute('/', renderHome);
    registerRoute('/portfolio', renderPortfolio);

    registerRoute('/tools', renderTools);
    registerRoute('/products', renderProducts);
    registerRoute('/alerts', renderAlerts);
    registerRoute('/orders', renderOrders);
    registerRoute('/admin', renderAdminLogin);
    registerRoute('/admin/dashboard', renderAdminDashboard);
    registerRoute('/admin/pricing', renderAdminPricing);
    registerRoute('/admin/stock', renderAdminStock);
    registerRoute('/admin/orders', renderAdminOrders);
    registerRoute('/admin/price-card', renderAdminPriceCard);
}

function showAlarmToast(alert, actualPrice) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast--alarm';
  toast.innerHTML = `
    <span style="font-size:1.5rem;">🔔</span>
    <div>
      <strong>Fiyat Alarmı!</strong><br>
      <small>${alert.label} hedef fiyatı (${alert.targetPrice}) ${alert.condition === 'above' ? 'aşıldı' : 'altına düştü'}: ${actualPrice.toFixed(2)} TL</small>
    </div>
  `;
  container.appendChild(toast);
  
  // Play sound if possible
  const audio = new Audio('/alarm.mp3');
  audio.play().catch(() => console.log('Ses çalınamadı.'));
  
  setTimeout(() => toast.remove(), 8000);
}

// Start Lifecycle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
