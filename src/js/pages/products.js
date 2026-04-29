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
        <div class="ar-header" style="position:absolute; top:0; left:0; right:0; padding:15px; display:flex; justify-content:space-between; align-items:center; z-index:100; background:linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);">
          <div style="color:white; font-size:10px; opacity:0.8; font-weight:500;">Görseller örnektir. Boyut farklılık gösterebilir.</div>
          <div style="display:flex; gap:10px;">
            <button class="btn-icon" id="btn-ar-share" style="background:rgba(255,255,255,0.2); backdrop-filter:blur(5px); color:white; border-radius:50%; width:36px; height:36px; border:none; display:flex; align-items:center; justify-content:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <button class="btn-icon" id="close-ar" style="background:rgba(255,255,255,0.2); backdrop-filter:blur(5px); color:white; border-radius:50%; width:36px; height:36px; border:none; display:flex; align-items:center; justify-content:center;">✕</button>
          </div>
        </div>

        <div id="ar-view-container" style="width:100%; height:100%; position:relative;">
          <!-- Desktop QR View -->
          <div id="ar-desktop-qr" style="display:none; width:100%; height:100%; background:var(--bg-primary); flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center;">
             <div style="background:white; padding:20px; border-radius:24px; margin-bottom:24px; box-shadow:0 10px 40px rgba(212,168,83,0.3);">
                <img id="ar-qr-img" src="" style="width:200px; height:200px;">
             </div>
             <h3 style="color:white; margin-bottom:12px;">Telefonda Dene</h3>
             <p style="color:var(--text-muted); font-size:14px; margin-bottom:40px; max-width:280px;">QR kodu kameranızla tarayarak ürünü kolunuzda hemen deneyin.</p>
             <div style="display:flex; background:var(--bg-surface); padding:10px 20px; border-radius:30px; gap:12px; align-items:center;">
                <span class="ar-tab active" style="color:var(--gold-500); font-weight:600; font-size:12px;">Resimde Gör</span>
                <span class="ar-tab" style="color:var(--text-muted); font-size:12px;">Kolumda Gör</span>
                <span class="ar-tab" style="color:var(--text-muted); font-size:12px;">Karşılaştır</span>
             </div>
          </div>

          <!-- Mobile Camera View -->
          <div id="ar-mobile-view" style="display:none; width:100%; height:100%; position:relative;">
            <video id="ar-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
            <div class="ar-overlay-mask" style="position:absolute; inset:0; background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.2) 100%); pointer-events:none;"></div>
            
            <img id="ar-overlay-img" src="" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:60%; pointer-events:auto; cursor:move; transition: none; filter: drop-shadow(0 15px 35px rgba(0,0,0,0.4)) contrast(1.05) brightness(1.05);">
            
            <div id="ar-hint-box" style="position:absolute; top:40%; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); padding:12px 20px; border-radius:12px; color:white; text-align:center; z-index:10; pointer-events:none; transition: opacity 0.5s;">
               <div style="font-size:24px; margin-bottom:8px;">↔️</div>
               <div style="font-size:13px; font-weight:500;">Ürüne dokunup sürükleyin</div>
            </div>

            <!-- Branding -->
            <div style="position:absolute; top:80px; left:20px; color:white; opacity:0.3; font-size:10px; z-index:10; font-family:serif;">
               Powered by<br><strong style="letter-spacing:1px;">NOVENTRA</strong>
            </div>

            <!-- Mobile Bottom Bar -->
            <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding:20px; z-index:100;">
              <div style="display:flex; background:rgba(255,255,255,0.95); padding:4px; border-radius:30px; margin-bottom:20px; width:fit-content; margin-inline:auto;">
                <button class="ar-mode-btn" style="padding:10px 15px; border-radius:26px; border:none; background:none; font-size:12px; font-weight:600;">Resimde Gör</button>
                <button class="ar-mode-btn active" style="padding:10px 15px; border-radius:26px; border:none; background:#000; color:#fff; font-size:12px; font-weight:600;">Kolumda Gör</button>
                <button class="ar-mode-btn" style="padding:10px 15px; border-radius:26px; border:none; background:none; font-size:12px; font-weight:600;">Karşılaştır</button>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div id="ar-product-info">
                   <div id="ar-product-name" style="color:white; font-size:13px; font-weight:600; margin-bottom:2px;">Ürün Yükleniyor...</div>
                   <div id="ar-product-price" style="color:var(--gold-500); font-size:16px; font-weight:800;">0.00 TL</div>
                </div>
                <button class="btn btn-gold" id="ar-add-to-cart" style="padding:12px 24px; border-radius:8px; font-weight:700;">SEPETE EKLE</button>
              </div>
            </div>

            <!-- Quick Controls -->
            <button id="btn-ar-camera" style="position:absolute; bottom:100px; left:20px; width:44px; height:44px; border-radius:50%; background:white; border:none; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:101;">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
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
let arStream = null;
let currentFacingMode = 'environment';
let currentX = 0, currentY = 0;
let arScale = 1;
let arRotation = 0;

async function openAR(product) {
  const modal = document.getElementById('ar-modal');
  const video = document.getElementById('ar-video');
  const overlay = document.getElementById('ar-overlay-img');
  const desktopView = document.getElementById('ar-desktop-qr');
  const mobileView = document.getElementById('ar-mobile-view');
  if (!modal || !video || !overlay) return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  modal.classList.add('active');
  overlay.src = product.image;

  // Update UI with product info
  document.getElementById('ar-product-name').textContent = product.name;
  const price = calculateProductPrice(product, currentGramPrice);
  document.getElementById('ar-product-price').textContent = formatCurrency(price);

  if (!isMobile) {
    desktopView.style.display = 'flex';
    mobileView.style.display = 'none';
    
    // Generate QR (pointing to current URL)
    const currentUrl = window.location.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentUrl)}`;
    document.getElementById('ar-qr-img').src = qrUrl;
    return;
  }

  // Mobile Experience
  desktopView.style.display = 'none';
  mobileView.style.display = 'block';
  
  // Reset state
  currentX = 0; currentY = 0; arScale = 1; arRotation = 0;
  updateOverlayTransform();
  
  const hintBox = document.getElementById('ar-hint-box');
  hintBox.style.opacity = '1';

  // Interaction Logic (Touch & Drag)
  let isDragging = false;
  let startX, startY;

  const startDrag = (e) => {
    isDragging = true;
    const pos = e.type === 'touchstart' ? e.touches[0] : e;
    startX = pos.clientX - currentX;
    startY = pos.clientY - currentY;
    hintBox.style.opacity = '0';
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

  // Remove old listeners to avoid duplicates if re-opened
  overlay.removeEventListener('mousedown', startDrag);
  overlay.removeEventListener('touchstart', startDrag);
  
  overlay.addEventListener('mousedown', startDrag);
  overlay.addEventListener('touchstart', startDrag);
  
  window.removeEventListener('mousemove', doDrag);
  window.removeEventListener('touchmove', doDrag);
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('touchmove', doDrag, { passive: false });
  
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  // Scale/Rotation with Pinch (Advanced - for now we'll add sliders back if needed, but let's try a premium feel)
  // Let's add a small control panel for scale if user wants to adjust
  if (!document.getElementById('ar-quick-controls')) {
     const qc = document.createElement('div');
     qc.id = 'ar-quick-controls';
     qc.style = 'position:absolute; top:80px; right:20px; display:flex; flex-direction:column; gap:15px; z-index:101;';
     qc.innerHTML = `
        <button id="ar-zoom-in" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.9); border:none; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold;">+</button>
        <button id="ar-zoom-out" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.9); border:none; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold;">-</button>
        <button id="ar-reset" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.9); border:none; display:flex; align-items:center; justify-content:center; font-size:16px;">🔄</button>
     `;
     mobileView.appendChild(qc);
     
     document.getElementById('ar-zoom-in').onclick = () => { arScale += 0.1; updateOverlayTransform(); };
     document.getElementById('ar-zoom-out').onclick = () => { arScale = Math.max(0.2, arScale - 0.1); updateOverlayTransform(); };
     document.getElementById('ar-reset').onclick = () => { currentX = 0; currentY = 0; arScale = 1; updateOverlayTransform(); };
  }

  function updateOverlayTransform() {
    overlay.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) scale(${arScale})`;
  }

  async function startCamera() {
    try {
      if (arStream) arStream.getTracks().forEach(t => t.stop());
      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      };
      arStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = arStream;
    } catch (err) {
      console.error("AR Kamera Hatası:", err);
      try {
        arStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = arStream;
      } catch (e) {
        alert("Kameraya erişilemedi. Lütfen izin verin.");
      }
    }
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
