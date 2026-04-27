// ============================================
// KUYUMCU PWA — Products Page (Advanced)
// ============================================
import { getProducts, CATEGORIES, calculateProductPrice } from '../services/product-service.js';
import { onPriceUpdate } from '../services/price-service.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { navigate } from '../router.js';

let unsubscribe = null;
let currentGramPrice = 0;
let selectedCategory = 'all';
let currentSort = 'default';
let compareList = [];
const STORE_WHATSAPP = '905555555555';

export function renderProducts(container) {
  initTemplate(container);
  renderCategories();
  renderProductGrid();

  // Sort listener
  document.getElementById('sort-filter')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderProductGrid();
  });

  // Comparison bar click
  document.getElementById('btn-compare-now')?.addEventListener('click', openCompareModal);
  document.getElementById('btn-clear-compare')?.addEventListener('click', () => {
    compareList = [];
    updateCompareBar();
    renderProductGrid();
  });
  
  document.getElementById('close-compare')?.addEventListener('click', () => {
    document.getElementById('compare-modal').classList.remove('active');
  });

  // Category click
  document.getElementById('category-scroll').addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;
    selectedCategory = chip.dataset.cat;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderProductGrid();
  });

  unsubscribe = onPriceUpdate((prices) => {
    const gram = prices.gram_altin;
    if (gram) {
      currentGramPrice = gram.marginSell;
      renderProductGrid();
    }
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}

function initTemplate(container) {
  container.innerHTML = `
    <h2 class="page__title">💍 Ürünler</h2>
    <p class="page__subtitle">Katalog ve Karşılaştırma</p>

    <div class="category-scroll" id="category-scroll"></div>
    
    <div class="filters-bar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
      <select id="sort-filter" class="filter-select" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:6px 12px; border-radius:8px; font-size:12px; color:white;">
        <option value="default">Sıralama: Varsayılan</option>
        <option value="price-asc">Fiyat: En Düşük</option>
        <option value="price-desc">Fiyat: En Yüksek</option>
        <option value="weight-desc">Ağırlık: En Ağır</option>
      </select>
      <div id="product-count" style="font-size:12px; color:var(--text-muted);">0 Ürün</div>
    </div>

    <div class="grid-2 stagger" id="product-grid"></div>

    <!-- Comparison Floating Bar -->
    <div class="compare-bar" id="compare-bar" style="position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(150%); width:90%; max-width:400px; background:var(--bg-elevated); border:1px solid var(--gold-500); border-radius:16px; padding:12px; display:flex; align-items:center; gap:12px; z-index:100; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <div id="compare-count-bubble" style="width:24px; height:24px; background:var(--gold-500); color:black; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">0</div>
      <div style="flex:1; font-size:12px; font-weight:600; color:white;">Ürün Kıyaslanıyor</div>
      <button class="btn btn-gold btn-sm" id="btn-compare-now" style="padding:6px 12px; font-size:11px; white-space:nowrap;">Şimdi Kıyasla</button>
      <button class="btn-icon" id="btn-clear-compare" style="color:var(--text-muted);">✕</button>
    </div>

    <!-- Comparison Modal -->
    <div class="modal-overlay" id="compare-modal">
      <div class="modal" style="max-height:90vh; overflow:hidden; padding:0; display:flex; flex-direction:column;">
        <div class="modal__header" style="padding:var(--space-4); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">⚖️ Ürün Kıyaslama</h3>
          <button class="btn-icon" id="close-compare">✕</button>
        </div>
        <div id="compare-table-content" style="flex:1; overflow-y:auto; padding:var(--space-4);"></div>
      </div>
    </div>

    <div class="modal-overlay" id="ar-modal">
      <div class="modal" style="height:90vh; padding:0; overflow:hidden; background:#000;">
        <button class="btn-icon btn-ghost" id="close-ar" style="position:absolute; top:var(--space-4); right:var(--space-4); z-index:1000; background:rgba(0,0,0,0.5);">✕</button>
        <div id="ar-camera-container" style="width:100%; height:100%; position:relative;">
          <video id="ar-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
          <img id="ar-overlay-img" src="" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:60%; pointer-events:auto; cursor:move; transition: none;">
          <div id="ar-hint" style="position:absolute; top:var(--space-10); left:0; right:0; text-align:center; color:white; font-size:10px; pointer-events:none; z-index:10;">
             ✨ Ürünü parmağınızla sürükleyip ayarlayın
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  let products = getProducts(selectedCategory);

  // Apply Sorting
  products = [...products].sort((a, b) => {
    const priceA = calculateProductPrice(a, currentGramPrice);
    const priceB = calculateProductPrice(b, currentGramPrice);
    if (currentSort === 'price-asc') return priceA - priceB;
    if (currentSort === 'price-desc') return priceB - priceA;
    if (currentSort === 'weight-desc') return b.weight - a.weight;
    return 0;
  });

  document.getElementById('product-count').textContent = `${products.length} Ürün`;

  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1; padding:40px; text-align:center; opacity:0.5;">Henüz ürün yok</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const price = calculateProductPrice(p, currentGramPrice);
    const isComparing = compareList.some(item => item.id === p.id);
    
    return `
      <div class="product-card" data-id="${p.id}" style="position:relative;">
        <button class="compare-toggle ${isComparing ? 'active' : ''}" data-id="${p.id}" style="position:absolute; top:10px; right:10px; z-index:5; width:32px; height:32px; border-radius:50%; background:${isComparing ? 'var(--gold-500)' : 'rgba(0,0,0,0.5)'}; border:none; color:${isComparing ? 'black' : 'white'}; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v8z"/><path d="M7 18v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2"/></svg>
        </button>
        <div class="product-card__img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">` : `<div class="emoji-placeholder" style="font-size:3rem;">${p.emoji}</div>`}
        </div>
        <div class="product-card__body">
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__meta">${p.karat} Ayar • ${formatNumber(p.weight)} gr</div>
          <div class="product-card__price">${formatCurrency(price)}</div>
          
          <div style="margin-top:var(--space-3); display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2);">
            <button class="btn btn-ghost btn-sm wa-ask" data-name="${p.name}" style="font-size:10px;">💬 Sor</button>
            <button class="btn btn-gold btn-sm ar-try" data-img="${p.image || ''}" style="font-size:10px;">✨ Dene</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners
  grid.querySelectorAll('.compare-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const product = products.find(p => p.id === id);
      toggleCompare(product);
    });
  });

  grid.querySelectorAll('.wa-ask').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = encodeURIComponent(`Merhaba, "${btn.dataset.name}" ürününüz hakkında bilgi almak istiyorum.`);
      window.open(`https://wa.me/905555555555?text=${text}`, '_blank');
    });
  });

  grid.querySelectorAll('.ar-try').forEach(btn => {
    btn.addEventListener('click', () => openAR(btn.dataset.img));
  });
}

function toggleCompare(product) {
  const index = compareList.findIndex(p => p.id === product.id);
  if (index > -1) {
    compareList.splice(index, 1);
  } else {
    if (compareList.length >= 3) {
      alert("En fazla 3 ürünü kıyaslayabilirsiniz.");
      return;
    }
    compareList.push(product);
  }
  updateCompareBar();
  renderProductGrid();
}

function updateCompareBar() {
  const bar = document.getElementById('compare-bar');
  const count = document.getElementById('compare-count-bubble');
  if (!bar || !count) return;

  if (compareList.length > 0) {
    bar.style.transform = 'translateX(-50%) translateY(0)';
    count.textContent = compareList.length;
  } else {
    bar.style.transform = 'translateX(-50%) translateY(150%)';
  }
}

function openCompareModal() {
  const modal = document.getElementById('compare-modal');
  const content = document.getElementById('compare-table-content');
  if (!modal || !content) return;

  modal.classList.add('active');

  content.innerHTML = `
    <div style="display:grid; grid-template-columns: 100px repeat(${compareList.length}, 1fr); gap:12px; font-size:12px;">
      <!-- Labels -->
      <div style="font-weight:bold; color:var(--text-muted); display:flex; flex-direction:column; gap:60px; padding-top:100px;">
        <div>Ürün</div>
        <div>Fiyat</div>
        <div>Ayar</div>
        <div>Ağırlık</div>
        <div>Gram Fiyatı</div>
      </div>
      
      <!-- Products -->
      ${compareList.map(p => {
        const price = calculateProductPrice(p, currentGramPrice);
        return `
          <div style="display:flex; flex-direction:column; gap:20px; text-align:center;">
            <div style="height:120px; background:var(--bg-surface-2); border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
              ${p.image ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:2rem;">${p.emoji}</span>`}
            </div>
            <div style="font-weight:bold; height:40px;">${p.name}</div>
            <div style="font-size:14px; font-weight:800; color:var(--text-gold);">${formatCurrency(price)}</div>
            <div>${p.karat} Ayar</div>
            <div>${formatNumber(p.weight)} gr</div>
            <div style="color:var(--text-muted);">${formatCurrency(price / p.weight)}/gr</div>
            <button class="btn btn-gold btn-sm wa-ask" data-name="${p.name}" style="margin-top:10px; width:100%; padding:6px; font-size:10px;">🛍️ Satın Al</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// AR Functions & Interactions
let arStream = null;
let currentFacingMode = 'environment';
let currentX = 0, currentY = 0;
let arScale = 1;
let arRotation = 0;

async function openAR(imgSrc) {
  const modal = document.getElementById('ar-modal');
  const video = document.getElementById('ar-video');
  const overlay = document.getElementById('ar-overlay-img');
  if (!modal || !video || !overlay) return;

  overlay.src = imgSrc;
  modal.classList.add('active');
  
  // Reset state
  currentX = 0; currentY = 0; arScale = 1; arRotation = 0;
  updateOverlayTransform();

  // Create controls if not exists
  if (!document.getElementById('ar-controls')) {
    const controls = document.createElement('div');
    controls.id = 'ar-controls';
    controls.style = 'position:absolute; bottom:50px; left:0; right:0; padding:15px; background:rgba(0,0,0,0.6); backdrop-filter:blur(10px); color:white; z-index:100;';
    controls.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <button class="btn btn-ghost" id="btn-switch-cam" style="color:white; border:1px solid white; font-size:11px; padding:5px 10px;">🔄 Kamera Değiştir</button>
        <span style="font-size:10px; opacity:0.8;">Parmağınızla sürükleyin</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <span style="font-size:14px;">📏</span>
        <input type="range" id="ar-scale" min="0.2" max="3" step="0.05" value="1" style="flex:1;">
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:14px;">🔄</span>
        <input type="range" id="ar-rotate" min="-180" max="180" step="1" value="0" style="flex:1;">
      </div>
    `;
    document.getElementById('ar-camera-container').appendChild(controls);

    // Controls Event Listeners
    document.getElementById('ar-scale').addEventListener('input', (e) => {
      arScale = e.target.value;
      updateOverlayTransform();
    });
    document.getElementById('ar-rotate').addEventListener('input', (e) => {
      arRotation = e.target.value;
      updateOverlayTransform();
    });
    document.getElementById('btn-switch-cam').addEventListener('click', toggleCamera);

    // Interaction Logic
    let isDragging = false;
    let startX, startY;

    const startDrag = (e) => {
      isDragging = true;
      const pos = e.type === 'touchstart' ? e.touches[0] : e;
      startX = pos.clientX - currentX;
      startY = pos.clientY - currentY;
      document.getElementById('ar-hint').style.display = 'none';
    };

    const doDrag = (e) => {
      if (!isDragging) return;
      if (e.type === 'touchmove') e.preventDefault();
      const pos = e.type === 'touchmove' ? e.touches[0] : e;
      currentX = pos.clientX - startX;
      currentY = pos.clientY - startY;
      updateOverlayTransform();
    };

    const endDrag = () => { isDragging = false; };

    overlay.addEventListener('mousedown', startDrag);
    overlay.addEventListener('touchstart', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  function updateOverlayTransform() {
    overlay.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${arScale}) rotate(${arRotation}deg)`;
  }

  async function startCamera() {
    try {
      if (arStream) arStream.getTracks().forEach(t => t.stop());
      const constraints = { 
        video: { 
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      arStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = arStream;
    } catch (err) {
      console.error("AR Kamera Hatası:", err);
      // Fallback
      try {
        arStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = arStream;
      } catch (e) {
        alert("Kameraya erişilemedi.");
      }
    }
  }

  async function toggleCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await startCamera();
  }

  await startCamera();
}

function renderCategories() {
  const scroll = document.getElementById('category-scroll');
  if (!scroll) return;

  scroll.innerHTML = CATEGORIES.map(cat => `
    <div class="category-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}">
      <span class="category-chip__emoji">${cat.emoji}</span>
      <span class="category-chip__label">${cat.label}</span>
    </div>
  `).join('');
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'close-ar') {
    document.getElementById('ar-modal').classList.remove('active');
    if (arStream) arStream.getTracks().forEach(t => t.stop());
  }
});
