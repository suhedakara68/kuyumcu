// ============================================
// NOVENTRA PWA — Admin Dashboard
// ============================================
import { navigate } from '../../router.js';
import { isAdmin, logoutAdmin } from './login.js';
import { onPriceUpdate } from '../../services/price-service.js';
import { getProducts } from '../../services/product-service.js';
import { getOrderStats } from '../../services/order-service.js';
import { formatCurrency, formatTime } from '../../utils/formatters.js';

let unsubscribe = null;

export function renderAdminDashboard(container) {
  if (!isAdmin()) { navigate('/admin'); return; }

  const header = document.querySelector('.header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'none';
  if (nav) nav.style.display = 'none';

  const products = getProducts();
  const stats = getOrderStats();

  container.className = 'page';
  container.innerHTML = `
    <div class="admin-header">
      <button class="admin-header__back" id="admin-back">←</button>
      <div>
        <h3 style="font-size:var(--font-size-md);font-weight:700;">Admin Panel</h3>
        <p style="font-size:var(--font-size-xs);color:var(--text-muted);">Yönetim Merkezi</p>
      </div>
      <button class="btn btn-ghost btn-sm" id="admin-logout" style="margin-left:auto;">Çıkış</button>
    </div>

    <div style="padding:var(--space-4);">
      <!-- Stats -->
      <div class="price-grid" style="margin-top:var(--space-4);">
        <div class="stat-card">
          <div class="stat-card__label">Gram Altın</div>
          <div class="stat-card__value text-gold" id="dash-gram">₺0,00</div>
          <div class="stat-card__sub" id="dash-time">-</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Toplam Ürün</div>
          <div class="stat-card__value">${products.length}</div>
          <div class="stat-card__sub">aktif</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Bekleyen Sipariş</div>
          <div class="stat-card__value text-gold">${stats.pending}</div>
          <div class="stat-card__sub">yeni</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Toplam Sipariş</div>
          <div class="stat-card__value">${stats.total}</div>
          <div class="stat-card__sub">tümü</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid-2" style="margin-top:var(--space-6);">
        <div class="admin-card" id="go-pricing">
          <div class="admin-card__icon">💰</div>
          <div class="admin-card__body">
            <div class="admin-card__title">Fiyat ve Kar Marjı</div>
            <div class="admin-card__desc">Alış/Satış farklarını yönet</div>
          </div>
        </div>

        <div class="admin-card" id="go-price-card">
          <div class="admin-card__icon" style="background:var(--gradient-gold); color:black;">📸</div>
          <div class="admin-card__body">
            <div class="admin-card__title">Sosyal Medya Kartı</div>
            <div class="admin-card__desc">Instagram/WhatsApp için fiyat resmi oluştur</div>
          </div>
        </div>

        <div class="admin-card" id="go-stock">
          <div class="admin-card__icon">💍</div>
          <div class="admin-card__body">
            <div class="admin-card__title">Stok ve Ürünler</div>
            <div class="admin-card__desc">Ürün listesini düzenle</div>
          </div>
        </div>

        <div class="admin-card" id="go-orders">
          <div class="admin-card__icon">🛍️</div>
          <div class="admin-card__body">
            <div class="admin-card__title">Sipariş Yönetimi</div>
            <div class="admin-card__desc">Müşteri taleplerini izle</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('admin-back').addEventListener('click', () => navigate('/'));
  document.getElementById('admin-logout').addEventListener('click', logoutAdmin);
  document.getElementById('go-pricing')?.addEventListener('click', () => navigate('/admin/pricing'));
  document.getElementById('go-price-card')?.addEventListener('click', () => navigate('/admin/price-card'));
  document.getElementById('go-stock')?.addEventListener('click', () => navigate('/admin/stock'));
  document.getElementById('go-orders')?.addEventListener('click', () => navigate('/admin/orders'));

  unsubscribe = onPriceUpdate((prices) => {
    const gram = prices.gram_altin;
    if (gram) {
      const el = document.getElementById('dash-gram');
      const timeEl = document.getElementById('dash-time');
      if (el) el.textContent = formatCurrency(gram.marginSell);
      if (timeEl) timeEl.textContent = formatTime(gram.updatedAt);
    }
  });

  return {
    destroy: () => {
      if (unsubscribe) unsubscribe();
      const h = document.querySelector('.header');
      const n = document.querySelector('.bottom-nav');
      if (h) h.style.display = '';
      if (n) n.style.display = '';
    }
  };
}
