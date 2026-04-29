// ============================================
// KUYUMCU PWA — Products Page (Fixing Clicks & Visibility)
// ============================================
import { getProducts, CATEGORIES, calculateProductPrice } from '../services/product-service.js';
import { onPriceUpdate } from '../services/price-service.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { arService } from '../services/ar-service.js';

let currentGramPrice = 0;
let selectedCategory = 'all';

export function renderProducts(container) {
  ensureARModalExists();
  
  container.innerHTML = `
    <div class="products-page" style="padding:20px; padding-bottom:100px;">
      <h2 class="page__title">Ürünler</h2>
      <div class="category-scroll" id="category-scroll"></div>
      <div class="grid-2" id="product-grid"></div>
    </div>
  `;
  
  renderCategories();
  renderProductGrid();
  setupGlobalListeners();

  const unsubscribe = onPriceUpdate((prices) => {
    if (prices.gram_altin) {
      currentGramPrice = prices.gram_altin.marginSell;
      renderProductGrid();
    }
  });

  return { destroy: () => { if (unsubscribe) unsubscribe(); arService.stop(); } };
}

function ensureARModalExists() {
  if (document.getElementById('ar-modal')) return;
  
  const modalHtml = `
    <div id="ar-modal" style="display:none; position:fixed; inset:0; z-index:999999; background:#000;">
      <div style="position:absolute; top:20px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:center; z-index:1100;">
        <div style="color:white; font-weight:bold; font-size:14px;">NOVENTRA AR</div>
        <button id="close-ar" style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); border:none; color:white; font-size:24px;">✕</button>
      </div>
      
      <video id="ar-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
      <div id="ar-frozen-bg" style="display:none; position:absolute; inset:0; z-index:5; background-size:cover; background-position:center; transform:scaleX(-1);"></div>
      <canvas id="ar-canvas" style="position:absolute; inset:0; width:100%; height:100%; z-index:50; pointer-events:none;"></canvas>
      
      <div id="ar-status" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:15px 25px; border-radius:30px; font-size:14px; z-index:200; text-align:center;">
        Başlatılıyor...
      </div>

      <div style="position:absolute; bottom:0; left:0; right:0; padding:40px 20px; background:linear-gradient(to top, rgba(0,0,0,1), transparent); z-index:1100;">
        <div style="display:flex; justify-content:center; margin-bottom:30px;">
           <button id="btn-snapshot" style="width:64px; height:64px; border-radius:50%; background:white; border:5px solid #d4a853; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div style="width:20px; height:20px; background:#333; border-radius:3px; pointer-events:none;"></div>
           </button>
           <button id="btn-reset-ar" style="display:none; width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.2); border:none; color:white; margin-left:20px; align-items:center; justify-content:center;">↺</button>
        </div>
        <h3 id="ar-product-name" style="color:white; margin:0; font-size:18px;">Ürün</h3>
        <div id="ar-product-price" style="color:#d4a853; font-size:20px; font-weight:bold;">0.00 TL</div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function setupGlobalListeners() {
  document.addEventListener('click', async (e) => {
    const target = e.target;
    
    // AR Button
    const tryBtn = target.closest('.ar-try-btn');
    if (tryBtn) {
      const product = getProducts().find(p => p.id === tryBtn.dataset.id);
      if (product) openAR(product);
    }

    // Close AR
    if (target.id === 'close-ar' || target.closest('#close-ar')) {
      document.getElementById('ar-modal').style.display = 'none';
      document.getElementById('ar-frozen-bg').style.display = 'none';
      arService.stop();
    }

    // SHUTTER / SNAPSHOT (Crucial Fix)
    const snapshotBtn = target.closest('#btn-snapshot');
    if (snapshotBtn) {
      console.log("Snapshot clicked");
      document.getElementById('ar-status').textContent = 'FOTOĞRAF ÇEKİLİYOR...';
      document.getElementById('ar-status').style.display = 'block';
      
      try {
        const bgData = await arService.takeSnapshot();
        const frozenBg = document.getElementById('ar-frozen-bg');
        frozenBg.style.backgroundImage = `url(${bgData})`;
        frozenBg.style.display = 'block';
        document.getElementById('ar-video').style.display = 'none';
        document.getElementById('btn-reset-ar').style.display = 'flex';
        snapshotBtn.style.display = 'none';
        document.getElementById('ar-status').style.display = 'none';
      } catch (err) {
        alert("Hata: Fotoğraf çekilemedi.");
      }
    }

    // RESET
    if (target.id === 'btn-reset-ar' || target.closest('#btn-reset-ar')) {
      document.getElementById('ar-frozen-bg').style.display = 'none';
      document.getElementById('ar-video').style.display = 'block';
      document.getElementById('btn-reset-ar').style.display = 'none';
      document.getElementById('btn-snapshot').style.display = 'flex';
      arService.start(arService.mode);
    }
  });
}

async function openAR(product) {
  const modal = document.getElementById('ar-modal');
  const status = document.getElementById('ar-status');
  const video = document.getElementById('ar-video');
  const canvas = document.getElementById('ar-canvas');

  modal.style.display = 'block';
  status.style.display = 'block';
  status.textContent = 'Yükleniyor...';

  try {
    document.getElementById('ar-product-name').textContent = product.name;
    const price = calculateProductPrice(product, currentGramPrice);
    document.getElementById('ar-product-price').textContent = formatCurrency(price);

    await arService.init(video, canvas, (msg) => { status.textContent = msg; });
    const mode = (product.category === 'kolye' || product.category === 'kupe') ? 'pose' : 'hand';
    await arService.start(mode);
    await arService.loadModel(product.model3d, product.image);
    
    // If no landmark after 3s, force display in center
    setTimeout(() => {
      if (status.style.display !== 'none') {
        status.textContent = 'Sizi takip ediyorum...';
        setTimeout(() => { status.style.display = 'none'; }, 2000);
      }
    }, 3000);
    
  } catch (err) {
    status.textContent = "HATA: " + err.message;
  }
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const products = getProducts(selectedCategory);
  grid.innerHTML = products.map(p => {
    const price = calculateProductPrice(p, currentGramPrice);
    return `
      <div class="product-card" style="background:#121225; border-radius:15px; overflow:hidden; border:1px solid #222;">
        <div style="height:140px; background:#000;"><img src="${p.image}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div style="padding:12px;">
          <div style="font-weight:bold; font-size:13px; margin-bottom:4px;">${p.name}</div>
          <div style="font-size:15px; color:#d4a853; font-weight:bold;">${formatCurrency(price)}</div>
          <button class="ar-try-btn" data-id="${p.id}" style="width:100%; background:#d4a853; border:none; padding:8px; border-radius:8px; margin-top:10px; font-weight:bold; font-size:12px; cursor:pointer;">DENE</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCategories() {
  const scroll = document.getElementById('category-scroll');
  if (!scroll) return;
  scroll.innerHTML = CATEGORIES.map(cat => `
    <div class="category-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}" style="display:inline-block; padding:8px 15px; background:#121225; border-radius:10px; margin-right:8px; font-size:12px; cursor:pointer; color:white;">
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
