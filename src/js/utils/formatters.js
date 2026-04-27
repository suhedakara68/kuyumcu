// ============================================
// KUYUMCU PWA — Formatters
// ============================================

/** Format number as Turkish Lira */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/** Format number with commas (Turkish locale) */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/** Format percentage */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '%0,00';
  const sign = value >= 0 ? '+' : '';
  return `${sign}%${formatNumber(Math.abs(value))}`;
}

/** Format gram weight */
export function formatGram(value) {
  if (value == null || isNaN(value)) return '0 gr';
  return `${formatNumber(value)} gr`;
}

/** Relative time (e.g. "2 dk önce") */
export function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 5) return 'Az önce';
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return date.toLocaleDateString('tr-TR');
}

/** Format time as HH:MM:SS */
export function formatTime(date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Format date */
export function formatDate(date) {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Purity multiplier by karat */
export function getKaratMultiplier(karat) {
  const map = { 24: 1, 22: 0.9167, 18: 0.75, 14: 0.5833, 8: 0.333 };
  return map[karat] || 1;
}

/** Generate unique ID */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
