// ============================================
// KUYUMCU PWA — Products Page (Clean Version)
// ============================================
import { getProducts, CATEGORIES, calculateProductPrice } from '../services/product-service.js';
import { onPriceUpdate } from '../services/price-service.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

let currentGramPrice = 0;
let selectedCategory = 'all';
let currentSort = 'default';

export function renderProducts(container) {
  // 1. Build basic structure
  container.innerHTML = `
    <div class="products-page" style="padding:20px; padding-bottom:100px;">
      <h2 class="page__title">Ürünler</h2>
      <p class="page__subtitle">Mücevher Katalogu</p>

      <div class="category-scroll" id="category-scroll"></div>
      
      <div class="filters-bar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <select id="sort-filter" class="filter-select" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:8px 12px; border-radius:10px; font-size:12px; color:white;">
          <option value="default">Sıralama: Varsayılan</option>
          <option value="price-asc">Fiyat: En Düşük</option>
          <option value="price-desc">Fiyat: En Yüksek</option>
        </select>
        <div id="product-count" style="font-size:12px; color:var(--text-muted);">0 Ürün</div>
      </div>

      <div class="grid-2" id="product-grid"></div>
    </div>
  `;
  
  renderCategories();
  renderProductGrid();
  setupGlobalListeners();

  const unsubscribe = onPriceUpdate((prices) => {
    const gram = prices.gram_altin;
    if (gram) {
      currentGramPrice = gram.marginSell;
      renderProductGrid();
    }
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  let products = getProducts(selectedCategory);

  // Sorting
  products = [...products].sort((a, b) => {
    const priceA = calculateProductPrice(a, currentGramPrice);
    const priceB = calculateProductPrice(b, currentGramPrice);
    if (currentSort === 'price-asc') return priceA - priceB;
    if (currentSort === 'price-desc') return priceB - priceA;
    return 0;
  });

  document.getElementById('product-count').textContent = `${products.length} Ürün`;

  grid.innerHTML = products.map(p => {
    const price = calculateProductPrice(p, currentGramPrice);
    return `
      <div class="product-card" style="background:var(--bg-surface); border-radius:15px; overflow:hidden; border:1px solid var(--border-subtle);">
        <div class="product-card__image-wrap" style="height:160px; overflow:hidden;">
          <img src="${p.image}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="product-card__body" style="padding:15px;">
          <h4 style="margin:0 0 5px 0; font-size:13px; font-weight:600;">${p.name}</h4>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">${p.karat} Ayar • ${formatNumber(p.weight)} gr</div>
          <div style="font-size:16px; font-weight:bold; color:var(--gold-500); margin-bottom:15px;">${formatCurrency(price)}</div>
          <button class="wa-ask btn btn-gold btn-sm" data-name="${p.name}" style="width:100%; padding:10px; border-radius:8px; font-size:12px; font-weight:bold;">Bilgi Al (WhatsApp)</button>
        </div>
      </div>
    `;
  }).join('');
}

function setupGlobalListeners() {
  document.addEventListener('click', (e) => {
    const waBtn = e.target.closest('.wa-ask');
    if (waBtn) {
      const text = encodeURIComponent(`Merhaba, "${waBtn.dataset.name}" ürününüz hakkında bilgi almak istiyorum.`);
      window.open(`https://wa.me/905555555555?text=${text}`, '_blank');
    }
  });

  document.getElementById('sort-filter')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderProductGrid();
  });
}

function renderCategories() {
  const scroll = document.getElementById('category-scroll');
  if (!scroll) return;
  scroll.innerHTML = CATEGORIES.map(cat => `
    <div class="category-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}">
      ${cat.label}
    </div>
  `).join('');

  scroll.onclick = (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    selectedCategory = chip.dataset.cat;
    renderCategories();
    renderProductGrid();
  };
}
