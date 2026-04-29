// ============================================
// KUYUMCU PWA — Products Page (Advanced)
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
    <h2 class="page__title">Ürünler</h2>
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
          <h3 style="margin:0;">Ürün Kıyaslama</h3>
          <button class="btn-icon" id="close-compare">✕</button>
        </div>
        <div id="compare-table-content" style="flex:1; overflow-y:auto; padding:var(--space-4);"></div>
      </div>
    </div>

    <div class="modal-overlay" id="ar-modal">
      <div class="modal ar-modal-content" style="height:100dvh; width:100vw; max-width:none; padding:0; overflow:hidden; background:#000; border:none; border-radius:0; margin:0;">
        <!-- Header -->
        <div class="ar-header" style="position:absolute; top:0; left:0; right:0; padding:20px; display:flex; justify-content:space-between; align-items:center; z-index:100; background:linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);">
          <div style="color:white; font-size:12px; font-weight:500; letter-spacing:0.5px;">NOVENTRA <span style="color:var(--gold-500);">AR</span></div>
          <button class="btn-icon" id="close-ar" style="background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); color:white; border-radius:50%; width:40px; height:40px; border:1px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center;">✕</button>
        </div>

        <div id="ar-view-container" style="width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          <!-- Video Feed -->
          <video id="ar-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform: scaleX(-1);"></video>
          
          <!-- AR Canvas for Three.js (Now the main 3D layer) -->
          <canvas id="ar-canvas" style="position:absolute; inset:0; width:100%; height:100%; z-index:10; pointer-events:none;"></canvas>

          <!-- Premium AR HUD Elements -->
          <div class="ar-hud" style="position:absolute; inset:0; pointer-events:none; z-index:20;">
             <!-- Scanning Line -->
             <div style="position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(90deg, transparent, var(--gold-500), transparent); box-shadow:0 0 15px var(--gold-500); animation: scanLoop 3s linear infinite; opacity:0.3;"></div>
             
             <!-- Corner Guides -->
             <div style="position:absolute; top:40px; left:40px; width:30px; height:30px; border-top:2px solid rgba(212,168,83,0.5); border-left:2px solid rgba(212,168,83,0.5);"></div>
             <div style="position:absolute; top:40px; right:40px; width:30px; height:30px; border-top:2px solid rgba(212,168,83,0.5); border-right:2px solid rgba(212,168,83,0.5);"></div>
             <div style="position:absolute; bottom:180px; left:40px; width:30px; height:30px; border-bottom:2px solid rgba(212,168,83,0.5); border-left:2px solid rgba(212,168,83,0.5);"></div>
             <div style="position:absolute; bottom:180px; right:40px; width:30px; height:30px; border-bottom:2px solid rgba(212,168,83,0.5); border-right:2px solid rgba(212,168,83,0.5);"></div>

             <!-- Branding -->
             <div style="position:absolute; top:80px; left:20px; color:white; opacity:0.3; font-size:9px; letter-spacing:2px; transform:rotate(-90deg); transform-origin:left top;">LUXURY EXPERIENCE</div>
          </div>

          <!-- Interaction Hint -->
          <div id="ar-hint" style="position:absolute; bottom:180px; left:50%; transform:translateX(-50%); text-align:center; color:white; opacity:0; transition: opacity 0.5s; z-index:90;">
             <div style="font-size:24px; margin-bottom:8px;">🤌</div>
             <div style="font-size:12px; font-weight:500; text-shadow:0 2px 4px rgba(0,0,0,0.5);">İki parmağınızla boyutlandırın</div>
          </div>

          <!-- Bottom Controls -->
          <div class="ar-controls" style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%); padding:20px 20px 40px 20px; z-index:100;">
             
             <!-- Adjustment Sliders (Hidden by default, toggleable) -->
             <div id="ar-adjustments" style="display:none; flex-direction:column; gap:15px; margin-bottom:20px; padding:20px; background:rgba(255,255,255,0.05); border-radius:16px; border:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; justify-content:space-between; color:white; font-size:11px;"><span>Boyut</span><span id="val-scale">1.0</span></div>
                <input type="range" id="ar-scale-slider" min="0.2" max="3" step="0.05" value="1" style="width:100%; accent-color:var(--gold-500);">
                
                <div style="display:flex; justify-content:space-between; color:white; font-size:11px;"><span>Döndür</span><span id="val-rot">0°</span></div>
                <input type="range" id="ar-rot-slider" min="-180" max="180" step="1" value="0" style="width:100%; accent-color:var(--gold-500);">
             </div>

             <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:15px;">
                <div style="flex:1;">
                   <div id="ar-product-name" style="color:white; font-size:14px; font-weight:700; margin-bottom:2px;">Altın Kolye</div>
                   <div id="ar-product-price" style="color:var(--gold-500); font-size:18px; font-weight:800;">0.00 TL</div>
                </div>
                
                <div style="display:flex; gap:10px;">
                   <button id="btn-toggle-adjust" style="width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; display:flex; align-items:center; justify-content:center;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-8m0-4V4m-5 16v-5m0-4V4m10 16v-2m0-4V4M3 12h18"/></svg>
                   </button>
                   <button class="btn btn-gold" id="ar-buy-now" style="height:48px; padding:0 30px; border-radius:12px; font-weight:800; font-size:13px; letter-spacing:0.5px;">SATIN AL</button>
                </div>
             </div>

             <!-- Mode Selector -->
             <div style="margin-top:25px; display:flex; justify-content:center; gap:20px;">
                <button class="ar-mode-tab active" data-mode="auto" style="background:none; border:none; color:white; font-size:12px; font-weight:700; padding:5px 0; border-bottom:2px solid var(--gold-500);">OTOMATİK</button>
                <button class="ar-mode-tab" data-mode="manual" style="background:none; border:none; color:var(--text-muted); font-size:12px; font-weight:600; padding:5px 0;">MANUEL</button>
             </div>
          </div>

          <!-- Photo Flash Animation Overlay -->
          <div id="ar-flash" style="position:absolute; inset:0; background:white; opacity:0; pointer-events:none; z-index:200;"></div>
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
        <div class="product-card__image-wrap">
          <img src="${p.image}" class="product-card__image" loading="lazy">
          ${p.isNew ? '<span class="product-card__badge">YENİ</span>' : ''}
        </div>
        <div class="product-card__body">
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__meta">${p.karat} Ayar • ${formatNumber(p.weight)} gr</div>
          <div class="product-card__price">${formatCurrency(price)}</div>
          
          <div style="margin-top:var(--space-3); display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2);">
            <button class="btn btn-ghost btn-sm wa-ask" data-name="${p.name}" style="font-size:10px;">Sor</button>
            <button class="btn btn-gold btn-sm ar-try" data-img="${p.image || ''}" style="font-size:10px;">Dene</button>
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
    btn.addEventListener('click', () => {
      const id = btn.closest('.product-card').dataset.id;
      const product = products.find(p => p.id === id);
      openAR(product);
    });
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
            <button class="btn btn-gold btn-sm wa-ask" data-name="${p.name}" style="margin-top:10px; width:100%; padding:6px; font-size:10px;">Satın Al</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// AR Functions & Interactions
let arMode = 'auto'; // 'auto' or 'manual'
let autoX = 0, autoY = 0, autoScale = 1, autoRot = 0;
let manualX = 0, manualY = 0, manualScale = 1, manualRot = 0;
let isSnapActive = false;

async function openAR(product) {
  const modal = document.getElementById('ar-modal');
  const video = document.getElementById('ar-video');
  const overlay = document.getElementById('ar-overlay-img');
  const status = document.getElementById('ar-status');
  const canvas = document.getElementById('ar-canvas');
  
  if (!modal || !video || !overlay) return;

  modal.classList.add('active');
  overlay.src = product.image;
  
  // Update Product UI
  document.getElementById('ar-product-name').textContent = product.name;
  const price = calculateProductPrice(product, currentGramPrice);
  document.getElementById('ar-product-price').textContent = formatCurrency(price);

  // Initialize AR Service
  status.textContent = 'Kamera ve yapay zeka hazırlanıyor...';
  await arService.init(video, canvas);
  
  // Decide tracking mode based on category
  const trackMode = (product.category === 'kolye' || product.category === 'kupe') ? 'pose' : 'hand';
  
  arService.start(trackMode, (results) => {
    if (arMode !== 'auto') return;
    
    let pos = null;
    if (product.category === 'yuzuk') {
      pos = arService.getRingPosition(results);
    } else if (product.category === 'bilezik') {
      pos = arService.getBraceletPosition(results);
    } else if (product.category === 'kolye') {
      pos = arService.getNecklacePosition(results);
    }

    if (pos) {
      status.style.opacity = '0';
      isSnapActive = true;
      // Smooth interpolation
      autoX = autoX * 0.7 + (pos.x * 100) * 0.3;
      autoY = autoY * 0.7 + (pos.y * 100) * 0.3;
      autoScale = autoScale * 0.7 + pos.scale * 0.3;
      autoRot = autoRot * 0.7 + (pos.rotation * 180 / Math.PI) * 0.3;
      updateARTransform();
    } else {
      status.style.opacity = '1';
      status.textContent = `${product.category === 'kolye' ? 'Boynunuzu' : 'Elinizi'} kameraya yaklaştırın`;
      isSnapActive = false;
    }
  });

  setupARListeners(overlay);
}

function setupARListeners(overlay) {
  const sliders = document.getElementById('ar-adjustments');
  const btnToggle = document.getElementById('btn-toggle-adjust');
  const scaleSlider = document.getElementById('ar-scale-slider');
  const rotSlider = document.getElementById('ar-rot-slider');
  const tabs = document.querySelectorAll('.ar-mode-tab');

  btnToggle.onclick = () => {
    sliders.style.display = sliders.style.display === 'none' ? 'flex' : 'none';
    btnToggle.style.background = sliders.style.display === 'none' ? 'rgba(255,255,255,0.1)' : 'var(--gold-500)';
  };

  scaleSlider.oninput = (e) => {
    manualScale = parseFloat(e.target.value);
    document.getElementById('val-scale').textContent = manualScale.toFixed(1);
    updateARTransform();
  };

  rotSlider.oninput = (e) => {
    manualRot = parseInt(e.target.value);
    document.getElementById('val-rot').textContent = manualRot + '°';
    updateARTransform();
  };

  tabs.forEach(tab => {
    tab.onclick = () => {
      arMode = tab.dataset.mode;
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-muted)';
        t.style.borderBottom = 'none';
      });
      tab.classList.add('active');
      tab.style.color = 'white';
      tab.style.borderBottom = '2px solid var(--gold-500)';
      
      // Reset manual if switching to auto
      if (arMode === 'auto') {
        document.getElementById('ar-status').style.display = 'block';
      } else {
        document.getElementById('ar-status').style.display = 'none';
      }
      updateARTransform();
    };
  });

  // Drag logic for manual mode
  let isDragging = false;
  let startX, startY;

  const startDrag = (e) => {
    if (arMode !== 'manual') return;
    isDragging = true;
    const pos = e.type === 'touchstart' ? e.touches[0] : e;
    startX = pos.clientX - manualX;
    startY = pos.clientY - manualY;
  };

  const doDrag = (e) => {
    if (!isDragging || arMode !== 'manual') return;
    if (e.type === 'touchmove') e.preventDefault();
    const pos = e.type === 'touchmove' ? e.touches[0] : e;
    manualX = pos.clientX - startX;
    manualY = pos.clientY - startY;
    updateARTransform();
  };

  const endDrag = () => { isDragging = false; };

  overlay.addEventListener('mousedown', startDrag);
  overlay.addEventListener('touchstart', startDrag);
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('touchmove', doDrag, { passive: false });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
}

function updateARTransform() {
  const overlayWrap = document.getElementById('ar-overlay-wrap');
  if (!overlayWrap) return;

  if (arMode === 'auto') {
    // MediaPipe coordinate system is 0-1, we use % for translate
    // We also need to flip X because video is mirrored
    const displayX = 100 - autoX; 
    overlayWrap.style.left = `${displayX}%`;
    overlayWrap.style.top = `${autoY}%`;
    overlayWrap.style.transform = `translate(-50%, -50%) scale(${autoScale}) rotate(${autoRot}deg)`;
    overlayWrap.style.opacity = isSnapActive ? '1' : '0';
  } else {
    overlayWrap.style.left = '50%';
    overlayWrap.style.top = '50%';
    overlayWrap.style.transform = `translate(calc(-50% + ${manualX}px), calc(-50% + ${manualY}px)) scale(${manualScale}) rotate(${manualRot}deg)`;
    overlayWrap.style.opacity = '1';
  }
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
  if (e.target.id === 'close-ar' || e.target.closest('#close-ar')) {
    document.getElementById('ar-modal').classList.remove('active');
    if (arStream) arStream.getTracks().forEach(t => t.stop());
  }

  if (e.target.id === 'ar-add-to-cart') {
    alert("Ürün sepetinize eklendi!");
    document.getElementById('ar-modal').classList.remove('active');
    if (arStream) arStream.getTracks().forEach(t => t.stop());
  }

  if (e.target.id === 'btn-ar-share') {
    if (navigator.share) {
      navigator.share({
        title: 'Noventra Kuyumculuk',
        text: 'Bu ürünü denedim, harika görünüyor!',
        url: window.location.href
      });
    } else {
      alert("Paylaşım bu tarayıcıda desteklenmiyor.");
    }
  }
});
