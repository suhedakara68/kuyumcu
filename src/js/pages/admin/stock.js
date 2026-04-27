// ============================================
// KUYUMCU PWA — Admin Stock Management
// ============================================
import { navigate } from '../../router.js';
import { isAdmin } from './login.js';
import { getProducts, addProduct, updateProduct, deleteProduct, CATEGORIES } from '../../services/product-service.js';
import { formatNumber } from '../../utils/formatters.js';

export function renderAdminStock(container) {
  if (!isAdmin()) { navigate('/admin'); return; }

  const header = document.querySelector('.header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'none';
  if (nav) nav.style.display = 'none';

  container.className = 'page';
  container.innerHTML = `
    <div class="admin-header">
      <button class="admin-header__back" id="stock-back">←</button>
      <h3 style="font-size:var(--font-size-md);">📦 Stok Yönetimi</h3>
    </div>
    <div style="padding:var(--space-4);">
      <button class="btn btn-gold btn-block" id="add-product-btn" style="margin-bottom:var(--space-4);">
        ➕ Yeni Ürün Ekle
      </button>
      <div class="grid-1 stagger" id="stock-list"></div>
    </div>

    <div class="modal-overlay" id="product-modal">
      <div class="modal">
        <div class="modal__handle"></div>
        <h3 id="product-modal-title" style="margin-bottom:var(--space-4);">Yeni Ürün</h3>
        <div class="calc-form">
          <input type="hidden" id="product-edit-id">
          <div class="input-group">
            <label>Ürün Adı</label>
            <input type="text" class="input" id="product-name" placeholder="Bilezik - Burma Model">
          </div>
          <div class="input-group">
            <label>Kategori</label>
            <select class="select" id="product-category">
              ${CATEGORIES.filter(c => c.key !== 'all').map(c => `<option value="${c.key}">${c.emoji} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="input-row">
            <div class="input-group">
              <label>Ağırlık (gr)</label>
              <input type="number" class="input" id="product-weight" placeholder="0" step="0.1">
            </div>
            <div class="input-group">
              <label>Ayar</label>
              <select class="select" id="product-karat">
                <option value="24">24</option>
                <option value="22" selected>22</option>
                <option value="18">18</option>
                <option value="14">14</option>
                <option value="8">8</option>
              </select>
            </div>
          </div>
          <div class="input-row">
            <div class="input-group">
              <label>Stok Adedi</label>
              <input type="number" class="input" id="product-stock" placeholder="0" step="1" min="0">
            </div>
            <div class="input-group">
              <label>İşçilik (₺)</label>
              <input type="number" class="input" id="product-labor" placeholder="0" step="10">
            </div>
          </div>
          <div class="input-group">
            <label>Emoji İkonu</label>
            <input type="text" class="input" id="product-emoji" placeholder="💍" value="💍" style="font-size:1.5rem;">
          </div>
          <div style="display:flex; gap:var(--space-3);">
            <button class="btn btn-ghost btn-block" id="product-cancel">İptal</button>
            <button class="btn btn-gold btn-block" id="product-save">Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderStockList();

  document.getElementById('stock-back').addEventListener('click', () => navigate('/admin/dashboard'));

  document.getElementById('add-product-btn').addEventListener('click', () => {
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Yeni Ürün';
    clearProductForm();
    document.getElementById('product-modal').classList.add('active');
  });

  document.getElementById('product-cancel').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('active');
  });

  document.getElementById('product-save').addEventListener('click', () => {
    const editId = document.getElementById('product-edit-id').value;
    const data = {
      name: document.getElementById('product-name').value.trim(),
      category: document.getElementById('product-category').value,
      weight: parseFloat(document.getElementById('product-weight').value) || 0,
      karat: parseInt(document.getElementById('product-karat').value),
      stock: parseInt(document.getElementById('product-stock').value) || 0,
      laborCost: parseFloat(document.getElementById('product-labor').value) || 0,
      emoji: document.getElementById('product-emoji').value || '💍',
    };
    if (!data.name) return;

    if (editId) {
      updateProduct(editId, data);
    } else {
      addProduct(data);
    }
    document.getElementById('product-modal').classList.remove('active');
    renderStockList();
  });

  document.getElementById('stock-list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.stock-edit');
    const delBtn = e.target.closest('.stock-delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const product = getProducts().find(p => p.id === id);
      if (product) {
        document.getElementById('product-edit-id').value = id;
        document.getElementById('product-modal-title').textContent = 'Ürün Düzenle';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-weight').value = product.weight;
        document.getElementById('product-karat').value = product.karat;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-labor').value = product.laborCost || 0;
        document.getElementById('product-emoji').value = product.emoji;
        document.getElementById('product-modal').classList.add('active');
      }
    }

    if (delBtn) {
      if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        deleteProduct(delBtn.dataset.id);
        renderStockList();
      }
    }
  });

  return {
    destroy: () => {
      const h = document.querySelector('.header');
      const n = document.querySelector('.bottom-nav');
      if (h) h.style.display = '';
      if (n) n.style.display = '';
    }
  };
}

function renderStockList() {
  const list = document.getElementById('stock-list');
  if (!list) return;
  const products = getProducts();

  list.innerHTML = products.map(p => {
    const stockClass = p.stock <= 2 ? 'text-danger' : p.stock <= 5 ? 'text-gold' : 'text-success';
    return `
      <div class="stock-item">
        <div class="stock-item__img">${p.emoji}</div>
        <div class="stock-item__body">
          <div class="stock-item__name">${p.name}</div>
          <div class="stock-item__meta">${p.karat}K • ${formatNumber(p.weight)}gr • <span class="${stockClass}">${p.stock} adet</span></div>
        </div>
        <div class="stock-item__actions">
          <button class="btn-icon btn-ghost stock-edit" data-id="${p.id}" title="Düzenle">✏️</button>
          <button class="btn-icon btn-ghost stock-delete" data-id="${p.id}" title="Sil">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function clearProductForm() {
  ['product-name','product-weight','product-stock','product-labor'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('product-emoji').value = '💍';
}
