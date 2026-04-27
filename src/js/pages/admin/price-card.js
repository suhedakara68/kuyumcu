// ============================================
// NOVENTRA PWA — Social Media Price Card Gen (Premium Version)
// ============================================
import { navigate } from '../../router.js';
import { isAdmin } from './login.js';
import { onPriceUpdate, GOLD_KEYS, CURRENCY_KEYS } from '../../services/price-service.js';
import { formatCurrency } from '../../utils/formatters.js';

let unsubscribe = null;
let currentPrices = {};

export function renderAdminPriceCard(container) {
  if (!isAdmin()) { navigate('/admin'); return; }

  container.innerHTML = `
    <div class="admin-header">
      <button class="admin-header__back" id="card-back">←</button>
      <h2 style="font-size:1.2rem;">Lüks Kart Tasarımcı</h2>
    </div>

    <div class="page" style="padding:var(--space-4); background:var(--bg-primary); min-height:calc(100vh - 60px);">
      <div class="section">
        <div id="canvas-container" style="width:100%; max-width:340px; margin:0 auto; aspect-ratio: 9/16; background:#000; border-radius:24px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.8); position:relative; border: 1px solid rgba(212,168,83,0.2);">
           <canvas id="price-canvas" width="1080" height="1920" style="width:100%; height:100%; object-fit:contain;"></canvas>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:30px; max-width:340px; margin-left:auto; margin-right:auto;">
        <button class="btn btn-ghost" id="refresh-preview" style="border-radius:12px; border:1px solid var(--border-gold);">♻️ Tasarımı Yenile</button>
        <button class="btn btn-gold" id="download-card" style="border-radius:12px; box-shadow:var(--shadow-gold);">📥 Resmi İndir</button>
      </div>

      <div style="text-align:center; margin-top:24px; color:var(--text-muted); font-size:11px; line-height:1.6;">
        <p>✨ Bu tasarım Instagram Story (1080x1920) için optimize edilmiştir.<br>Profesyonel kuyumcu ekranı formatındadır.</p>
      </div>
    </div>
  `;

  document.getElementById('card-back').addEventListener('click', () => navigate('/admin/dashboard'));
  document.getElementById('refresh-preview').addEventListener('click', drawCard);
  document.getElementById('download-card').addEventListener('click', downloadImage);

  unsubscribe = onPriceUpdate((prices) => {
    currentPrices = prices;
    drawCard();
  });

  // Wait for fonts/images
  setTimeout(drawCard, 300);

  return { destroy: () => { if (unsubscribe) unsubscribe(); } };
}

async function drawCard() {
  const canvas = document.getElementById('price-canvas');
  if (!canvas || !currentPrices.gram_altin) return;
  const ctx = canvas.getContext('2d');

  // 1. Background (Premium Dark Radial)
  const bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/3, 0, canvas.width/2, canvas.height/3, canvas.width * 1.2);
  bgGrad.addColorStop(0, '#1E1E2E');
  bgGrad.addColorStop(1, '#0A0A10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Artistic Gold Glows
  drawGlow(ctx, 0, 0, 600, 'rgba(212, 168, 83, 0.15)');
  drawGlow(ctx, canvas.width, canvas.height, 800, 'rgba(212, 168, 83, 0.1)');

  // 3. Elegant Double Border
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
  ctx.globalAlpha = 0.3;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.globalAlpha = 1;

  // 4. Header Section
  ctx.textAlign = 'center';
  
  // Brand Name
  ctx.fillStyle = '#D4A853';
  ctx.font = '800 90px Inter, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('NOVENTRA', canvas.width / 2, 220);
  
  // Sub-brand
  ctx.letterSpacing = '2px';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '300 36px Inter, sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText('PREMIUM JEWELRY EXPERIENCE', canvas.width / 2, 280);
  ctx.globalAlpha = 1;

  // Date Badge
  const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  drawBadge(ctx, dateStr, canvas.width / 2, 380);

  // 5. Price Tables
  let y = 460;
  const rowHeight = 115;
  
  // Gold Section
  drawCategoryHeader(ctx, 'ALTIN PİYASASI', y);
  y += 100;

  GOLD_KEYS.forEach(key => {
    const p = currentPrices[key];
    if (p) {
      drawPriceRow(ctx, p.name, formatCurrency(p.marginSell), y);
      y += rowHeight;
    }
  });

  y += 40;

  // Currency Section
  drawCategoryHeader(ctx, 'DÖVİZ KURLARI', y);
  y += 100;

  CURRENCY_KEYS.forEach(key => {
    const p = currentPrices[key];
    if (p) {
      drawPriceRow(ctx, p.name, formatCurrency(p.marginSell), y);
      y += rowHeight;
    }
  });

  // 6. Footer (Moved lower and more stable)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#D4A853';
  ctx.font = 'bold 34px Inter, sans-serif';
  ctx.fillText('www.noventra.com', canvas.width / 2, canvas.height - 140);
  
  ctx.fillStyle = '#8B8BA7';
  ctx.font = '22px Inter, sans-serif';
  ctx.fillText('Anlık verilere dayanmaktadır. Yatırım tavsiyesi değildir.', canvas.width / 2, canvas.height - 90);
}

function drawGlow(ctx, x, y, size, color) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(x - size, y - size, size * 2, size * 2);
}

function drawBadge(ctx, text, x, y) {
  const width = ctx.measureText(text).width + 80;
  ctx.fillStyle = 'rgba(212, 168, 83, 0.15)';
  ctx.roundRect(x - width/2, y - 40, width, 70, 35);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 168, 83, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.fillStyle = '#D4A853';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(text, x, y + 8);
}

function drawCategoryHeader(ctx, text, y) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#D4A853';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(text, 140, y);
  
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(140, y + 20);
  ctx.lineTo(300, y + 20);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
}

function drawPriceRow(ctx, label, price, y) {
  // Glass card effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.roundRect(110, y - 55, ctx.canvas.width - 220, 90, 15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  // Label
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '400 38px Inter, sans-serif';
  ctx.fillText(label, 150, y + 5);

  // Price
  ctx.textAlign = 'right';
  ctx.fillStyle = '#D4A853';
  ctx.font = '800 48px Inter, sans-serif';
  ctx.fillText(price, ctx.canvas.width - 150, y + 10);
}

function downloadImage() {
  const canvas = document.getElementById('price-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `noventra-fiyat-listesi-${new Date().getTime()}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

// polyfill for roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
