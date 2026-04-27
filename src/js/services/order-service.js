// ============================================
// NOVENTRA PWA — Order Service
// ============================================
import { addDocument, getDocuments } from './firebase-service.js';

const STORAGE_KEY = 'noventra_orders';
let ordersCache = null;

export const ORDER_STATUSES = {
  pending:    { label: 'Beklemede',    icon: '⏳', color: 'gold' },
  confirmed:  { label: 'Onaylandı',   icon: '✅', color: 'success' },
  preparing:  { label: 'Hazırlanıyor', icon: '🔨', color: 'info' },
  completed:  { label: 'Tamamlandı',  icon: '📦', color: 'success' },
  cancelled:  { label: 'İptal Edildi', icon: '❌', color: 'danger' },
};

// Demo siparişler
const DEFAULT_ORDERS = [
  { id: 'ORD-001', customerName: 'Ayşe Yılmaz', phone: '0532 111 2233', product: 'Bilezik - Burma Model', weight: 15.2, karat: 22, note: 'Hediye paketi olsun', status: 'pending', createdAt: Date.now() - 86400000 },
  { id: 'ORD-002', customerName: 'Mehmet Demir', phone: '0543 222 3344', product: 'Tek Taş Yüzük', weight: 3.8, karat: 14, note: '', status: 'confirmed', createdAt: Date.now() - 172800000 },
  { id: 'ORD-003', customerName: 'Fatma Kaya', phone: '0555 333 4455', product: 'Altın Kolye', weight: 8.5, karat: 22, note: 'İsim yazılacak', status: 'completed', createdAt: Date.now() - 259200000 },
];

function loadOrders() {
  if (ordersCache) return ordersCache;
  const saved = localStorage.getItem(STORAGE_KEY);
  ordersCache = saved ? JSON.parse(saved) : [...DEFAULT_ORDERS];
  return ordersCache;
}

function saveOrders(orders) {
  ordersCache = orders;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/** Initialize orders from Firebase */
export async function initOrders() {
  try {
    // Load from cloud
    const cloudOrders = await getDocuments('orders');
    if (cloudOrders && cloudOrders.length > 0) {
      ordersCache = cloudOrders;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersCache));
    } else {
      loadOrders();
    }
  } catch (e) {
    console.warn('Siparişler buluttan yüklenemedi, yerel veriler kullanılıyor.');
    loadOrders();
  }
}

export function getOrders(statusFilter = 'all') {
  const orders = loadOrders();
  if (statusFilter === 'all') return orders;
  return orders.filter(o => o.status === statusFilter);
}

export async function addOrder(orderData) {
  const orders = loadOrders();
  const newOrder = {
    id: Date.now().toString(),
    ...orderData,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  
  // Save to cloud
  await addDocument('orders', newOrder);
  
  return newOrder;
}

export function updateOrderStatus(id, status) {
  const orders = loadOrders();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    order.updatedAt = Date.now();
    saveOrders(orders);
  }
  return order;
}

export function getOrderStats() {
  const orders = loadOrders();
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };
}
