// ============================================
// KUYUMCU PWA — Products Page (Bulletproof Fix)
// ============================================
import { getProducts, CATEGORIES, calculateProductPrice } from '../services/product-service.js';
import { onPriceUpdate } from '../services/price-service.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { navigate } from '../router.js';
import { arService } from '../services/ar-service.js';

let unsubscribe = null;
let currentGramPrice = 0;
let selectedCategory = 'all';
let currentSort = 'default';
let compareList = [];

/**
 * Main Render Function
 */
export function renderProducts(container) {
  // 1. Build basic structure
  initTemplate(container);
  
  // 2. Initial Data Load
  renderCategories();
  renderProductGrid();
  
  // 3. Attach Bulletproof Listeners
  setupGlobalClickHandlers();

  // 4. Live Updates
  unsubscribe = onPriceUpdate((prices) => {
    const gram = prices.gram_altin;
    if (gram) {
      currentGramPrice = gram.marginSell;
      renderProductGrid();
    }
  });

  return { 
    destroy: () => { 
      if (unsubscribe) unsubscribe(); 
      arService.stop();
      // Remove global listener logic here if needed
    } 
  };
}

function initTemplate(container) {
  container.innerHTML = `
    <div class="products-page" style="padding-bottom:100px;">
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

      <div class="grid-2" id="product-grid" style="pointer-events: auto !important;"></div>

      <!-- AR Modal -->
      <div class="modal-overlay" id="ar-modal" style="display:none; position:fixed; inset:0; z-index:1000; background:#000;">
        <div class="ar-header" style="position:absolute; top:0; left:0; right:0; padding:20px; display:flex; justify-content:space-between; align-items:center; z-index:1100;">
          <div style="color:white; font-size:12px; font-weight:bold; letter-spacing:1px;">NOVENTRA <span style="color:var(--gold-500);">3D AR</span></div>
          <button id="close-ar" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); border:none; color:white; font-size:20px; cursor:pointer;">✕</button>
        </div>

        <div id="ar-view-container" style="width:100%; height:100%; position:relative;">
          <video id="ar-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform: scaleX(-1);"></video>
          <canvas id="ar-canvas" style="position:absolute; inset:0; width:100%; height:100%; z-index:1050; pointer-events:none;"></canvas>
          <div id="ar-status" style="position:absolute; top:80px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:30px; font-size:12px; z-index:1200; white-space:nowrap;">
             Hazırlanıyor...
          </div>
          
          <div class="ar-ui-bottom" style="position:absolute; bottom:0; left:0; right:0; padding:30px 20px; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index:1100;">
             <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                   <h3 id="ar-product-name" style="color:white; margin:0 0 5px 0; font-size:16px;">Ürün Adı</h3>
                   <div id="ar-product-price" style="color:var(--gold-500); font-size:20px; font-weight:bold;">0.00 TL</div>
                </div>
                <button id="ar-add-to-cart" style="background:var(--gold-500); color:black; border:none; padding:12px 25px; border-radius:12px; font-weight:bold; font-size:14px;">SATIN AL</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  const products = getProducts(selectedCategory);
  document.getElementById('product-count').textContent = `${products.length} Ürün`;

  grid.innerHTML = products.map(p => {
    const price = calculateProductPrice(p, currentGramPrice);
    return `
      <div class="product-card" data-id="${p.id}" style="position:relative; background:var(--bg-surface); border-radius:20px; overflow:hidden; border:1px solid var(--border-subtle);">
        <div class="product-card__image-wrap" style="height:160px; overflow:hidden;">
          <img src="${p.image}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="product-card__body" style="padding:15px;">
          <h4 style="margin:0 0 5px 0; font-size:13px; font-weight:600;">${p.name}</h4>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">${p.karat} Ayar • ${formatNumber(p.weight)} gr</div>
          <div style="font-size:16px; font-weight:bold; color:var(--gold-500); margin-bottom:15px;">${formatCurrency(price)}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <button class="wa-ask" data-name="${p.name}" style="background:rgba(255,255,255,0.05); color:white; border:1px solid var(--border-subtle); padding:8px; border-radius:10px; font-size:11px; cursor:pointer;">Soru Sor</button>
            <button class="ar-try-btn" data-id="${p.id}" style="background:var(--gold-500); color:black; border:none; padding:8px; border-radius:10px; font-size:11px; font-weight:bold; cursor:pointer; position:relative; z-index:10;">Dene</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupGlobalClickHandlers() {
  // Use a global document listener to catch all clicks regardless of DOM state
  document.addEventListener('click', async (e) => {
    const target = e.target;

    // 1. AR TRY BUTTON
    if (target.classList.contains('ar-try-btn') || target.closest('.ar-try-btn')) {
      const btn = target.classList.contains('ar-try-btn') ? target : target.closest('.ar-try-btn');
      const productId = btn.dataset.id;
      const product = getProducts().find(p => p.id === productId);
      
      // Visual feedback
      btn.style.opacity = '0.5';
      btn.textContent = '...';
      
      if (product) {
        await openAR(product);
      }
      
      btn.style.opacity = '1';
      btn.textContent = 'Dene';
    }

    // 2. CLOSE AR
    if (target.id === 'close-ar' || target.closest('#close-ar')) {
      const modal = document.getElementById('ar-modal');
      if (modal) modal.style.display = 'none';
      arService.stop();
    }

    // 3. ADD TO CART / BUY
    if (target.id === 'ar-add-to-cart') {
      alert('Ürün sepetinize eklendi!');
      const modal = document.getElementById('ar-modal');
      if (modal) modal.style.display = 'none';
      arService.stop();
    }
    
    // 4. WHATSAPP ASK
    if (target.classList.contains('wa-ask') || target.closest('.wa-ask')) {
      const btn = target.classList.contains('wa-ask') ? target : target.closest('.wa-ask');
      const text = encodeURIComponent(`Merhaba, "${btn.dataset.name}" ürününüz hakkında bilgi almak istiyorum.`);
      window.open(`https://wa.me/905555555555?text=${text}`, '_blank');
    }
  });
}

async function openAR(product) {
  const modal = document.getElementById('ar-modal');
  const video = document.getElementById('ar-video');
  const canvas = document.getElementById('ar-canvas');
  const status = document.getElementById('ar-status');
  
  if (!modal || !video || !canvas) return;

  modal.style.display = 'block';
  status.textContent = 'Kamera Başlatılıyor...';
  
  try {
    document.getElementById('ar-product-name').textContent = product.name;
    const price = calculateProductPrice(product, currentGramPrice);
    document.getElementById('ar-product-price').textContent = formatCurrency(price);

    await arService.init(video, canvas);
    const mode = (product.category === 'kolye' || product.category === 'kupe') ? 'pose' : 'hand';
    
    await arService.start(mode, () => {
      status.style.display = 'none';
    });

    if (product.model3d) {
      status.textContent = '3D Model Hazırlanıyor...';
      await arService.loadModel(product.model3d).catch(() => console.warn("Model fallback"));
    }

  } catch (err) {
    console.error("AR Error:", err);
    status.textContent = 'Hata: Kamera başlatılamadı.';
    status.style.background = '#e74c3c';
  }
}

function renderCategories() {
  const scroll = document.getElementById('category-scroll');
  if (!scroll) return;
  scroll.innerHTML = CATEGORIES.map(cat => `
    <div class="category-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}" style="display:inline-block; padding:8px 15px; background:rgba(255,255,255,0.05); border-radius:12px; margin-right:10px; font-size:12px; color:white; cursor:pointer; border:1px solid transparent;">
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
