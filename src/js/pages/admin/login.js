// ============================================
// NOVENTRA PWA — Admin Login (Premium)
// ============================================
import { navigate } from '../../router.js';

export function isAdmin() {
  return localStorage.getItem('noventra_admin_auth') === 'true';
}

export function logoutAdmin() {
  localStorage.removeItem('noventra_admin_auth');
  window.location.reload();
}

export function renderAdminLogin(container) {
  container.innerHTML = `
    <div class="admin-login-wrapper" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: radial-gradient(circle at center, #161625 0%, #0A0A14 100%);">
      
      <div class="login-card" style="width: 100%; max-width: 400px; background: rgba(30, 30, 50, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(212, 168, 83, 0.2); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); position: relative; overflow: hidden;">
        
        <!-- Decorative Light -->
        <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(212, 168, 83, 0.15) 0%, transparent 70%);"></div>

        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; background: var(--gradient-gold); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: var(--shadow-gold);">💎</div>
          <h2 style="font-size: 24px; font-weight: 800; color: white; margin-bottom: 8px; letter-spacing: -0.5px;">Yönetici Girişi</h2>
          <p style="color: var(--text-muted); font-size: 14px;">Noventra Kuyumculuk Admin Paneli</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 20px;">
          <div class="input-group">
            <label style="color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 1px;">Kullanıcı Adı</label>
            <input type="text" id="username" placeholder="admin" required 
              style="width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 16px; color: white; font-size: 16px; transition: all 0.3s ease;">
          </div>

          <div class="input-group">
            <label style="color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 1px;">Şifre</label>
            <input type="password" id="password" placeholder="••••••••" required 
              style="width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 16px; color: white; font-size: 16px; transition: all 0.3s ease;">
          </div>

          <div style="margin: 8px 0;">
            <p id="login-error" style="color: var(--color-danger); font-size: 13px; text-align: center; display: none;">Hatalı kullanıcı adı veya şifre!</p>
          </div>

          <button type="submit" class="btn-gold" 
            style="width: 100%; padding: 16px; border-radius: 12px; border: none; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
            Sisteme Giriş Yap
          </button>
        </form>

        <div style="text-align: center; margin-top: 32px;">
          <button id="btn-back-to-site" style="background: transparent; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: color 0.3s ease;">
            ← Mağazaya Geri Dön
          </button>
        </div>
      </div>
    </div>
  `;

  // Focus effect for inputs
  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'rgba(212, 168, 83, 0.5)';
      input.style.background = 'rgba(255, 255, 255, 0.08)';
      input.style.boxShadow = '0 0 0 4px rgba(212, 168, 83, 0.1)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      input.style.background = 'rgba(255, 255, 255, 0.05)';
      input.style.boxShadow = 'none';
    });
  });

  // Handle Login
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Demo Admin Credentials
    if (user === 'admin' && pass === 'noventra2024') {
      localStorage.setItem('noventra_admin_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      const errorEl = document.getElementById('login-error');
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 3000);
    }
  });

  document.getElementById('btn-back-to-site').addEventListener('click', () => {
    navigate('/');
  });
}
