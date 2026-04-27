// ============================================
// NOVENTRA PWA — Install Guide Component
// ============================================

export function showInstallGuide() {
  // Only show if not already installed and on mobile
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (!isIOS && !isAndroid) return;

  const guideId = 'pwa-install-guide';
  if (document.getElementById(guideId)) return;

  const modal = document.createElement('div');
  modal.id = guideId;
  modal.className = 'modal-overlay active';
  modal.style.zIndex = '2000';

  const content = isIOS ? `
    <div class="modal" style="text-align:center; padding:var(--space-8);">
      <img src="/logo.png" style="width:80px; border-radius:20px; margin-bottom:var(--space-4);">
      <h3 style="margin-bottom:var(--space-2);">Noventra'yı Yükleyin</h3>
      <p style="font-size:var(--font-size-sm); color:var(--text-muted); margin-bottom:var(--space-6);">
        Uygulamayı ana ekranınıza ekleyerek tam ekran ve hızlı bir deneyim yaşayın.
      </p>
      <div style="background:rgba(255,255,255,0.05); padding:var(--space-4); border-radius:var(--radius-md); text-align:left;">
        <div style="margin-bottom:var(--space-3); display:flex; align-items:center; gap:var(--space-3);">
          <span style="background:var(--color-gold); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px;">1</span>
          <span>Paylaş ikonuna dokunun ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> )</span>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <span style="background:var(--color-gold); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px;">2</span>
          <span>"Ana Ekrana Ekle" seçeneğini seçin</span>
        </div>
      </div>
      <button class="btn btn-gold btn-block" style="margin-top:var(--space-6);" id="close-guide">Anladım</button>
    </div>
  ` : `
    <div class="modal" style="text-align:center; padding:var(--space-8);">
      <img src="/logo.png" style="width:80px; border-radius:20px; margin-bottom:var(--space-4);">
      <h3 style="margin-bottom:var(--space-2);">Noventra'yı Yükleyin</h3>
      <p style="font-size:var(--font-size-sm); color:var(--text-muted); margin-bottom:var(--space-6);">
        Uygulamayı ana ekranınıza ekleyerek bildirimlerden ve tam ekran modundan faydalanın.
      </p>
      <div style="background:rgba(255,255,255,0.05); padding:var(--space-4); border-radius:var(--radius-md); text-align:left;">
        <div style="margin-bottom:var(--space-3); display:flex; align-items:center; gap:var(--space-3);">
          <span style="background:var(--color-gold); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px;">1</span>
          <span>Tarayıcı menüsünü açın ( ⋮ )</span>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-3);">
          <span style="background:var(--color-gold); width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px;">2</span>
          <span>"Uygulamayı Yükle"ye dokunun</span>
        </div>
      </div>
      <button class="btn btn-gold btn-block" style="margin-top:var(--space-6);" id="close-guide">Anladım</button>
    </div>
  `;

  modal.innerHTML = content;
  document.body.appendChild(modal);

  document.getElementById('close-guide').addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  });
}
