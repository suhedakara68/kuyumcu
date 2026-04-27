// ============================================
// NOVENTRA PWA — Product Service
// ============================================
import { saveGlobalData, loadGlobalData } from './firebase-service.js';

const STORAGE_KEY = 'noventra_products';
let productsCache = null;

// Demo ürünler
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Altın Kolye - Halat Zincir', category: 'kolye', karat: 22, weight: 8.5, price: 0, stock: 3, image: '/products/necklace.png', emoji: '📿', laborCost: 250 },
  { id: 'p2', name: 'Bilezik - Burma Model', category: 'bilezik', karat: 22, weight: 15.2, price: 0, stock: 5, image: '/products/bracelet.png', emoji: '💍', laborCost: 400 },
  { id: 'p3', name: 'Tek Taş Yüzük', category: 'yuzuk', karat: 14, weight: 3.8, price: 0, stock: 8, image: '/products/ring.png', emoji: '💎', laborCost: 500 },
  { id: 'p4', name: 'Altın Küpe - Halka', category: 'kupe', karat: 18, weight: 4.2, price: 0, stock: 6, image: '/products/necklace.png', emoji: '✨', laborCost: 180 },
  { id: 'p5', name: 'Çeyrek Altın', category: 'altin', karat: 22, weight: 1.75, price: 0, stock: 20, image: '/products/coins.png', emoji: '🪙', laborCost: 0 },
  { id: 'p6', name: 'Tam Altın - Cumhuriyet', category: 'altin', karat: 22, weight: 7.02, price: 0, stock: 10, image: '/products/coins.png', emoji: '🏅', laborCost: 0 },
];

export const CATEGORIES = [
  { key: 'all', label: 'Tümü', emoji: '🏷️' },
  { key: 'bilezik', label: 'Bilezik', emoji: '💍' },
  { key: 'kolye', label: 'Kolye', emoji: '📿' },
  { key: 'yuzuk', label: 'Yüzük', emoji: '💎' },
  { key: 'kupe', label: 'Küpe', emoji: '✨' },
  { key: 'altin', label: 'Altın', emoji: '🪙' },
];

function loadProducts() {
  if (productsCache && productsCache.length > 0) return productsCache;
  const saved = localStorage.getItem(STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : [];
  
  if (parsed.length > 0) {
    productsCache = parsed;
  } else {
    productsCache = [...DEFAULT_PRODUCTS];
  }
  return productsCache;
}

function saveProducts(products) {
  productsCache = products;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  saveGlobalData('products', { items: products, updatedAt: new Date() });
}

/** Initialize products from Firebase */
export async function initProducts() {
  try {
    const cloudData = await loadGlobalData('products');
    if (cloudData && cloudData.items && cloudData.items.length > 0) {
      productsCache = cloudData.items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productsCache));
    } else {
      loadProducts();
    }
  } catch (e) {
    console.warn('Ürünler buluttan yüklenemedi, yerel veriler kullanılıyor.');
    loadProducts();
  }
}

export function getProducts(category = 'all') {
  const products = loadProducts();
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}

export function getProduct(id) {
  return loadProducts().find(p => p.id === id) || null;
}

export function addProduct(product) {
  const products = loadProducts();
  product.id = 'p' + Date.now();
  products.push(product);
  saveProducts(products);
  return product;
}

export function updateProduct(id, updates) {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx > -1) {
    products[idx] = { ...products[idx], ...updates };
    saveProducts(products);
    return products[idx];
  }
  return null;
}

export function deleteProduct(id) {
  let products = loadProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
}

/** Calculate product price based on current gold price */
export function calculateProductPrice(product, gramPrice) {
  const karatMultiplier = { 24: 1, 22: 0.9167, 18: 0.75, 14: 0.5833, 8: 0.333 };
  const mult = karatMultiplier[product.karat] || 1;
  const goldValue = product.weight * gramPrice * mult;
  return goldValue + (product.laborCost || 0);
}

