// ============================================
// NOVENTRA PWA — TradingView Chart Component
// ============================================

export function renderTVChart(containerId, symbol = 'FX_IDC:XAUTRY') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => {
    new window.TradingView.widget({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Europe/Istanbul",
      "theme": "dark",
      "style": "1",
      "locale": "tr",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "hide_top_toolbar": true,
      "save_image": false,
      "container_id": containerId,
      "backgroundColor": "rgba(10, 10, 20, 1)",
      "gridColor": "rgba(255, 255, 255, 0.06)",
    });
  };
  document.head.appendChild(script);
}

/** Map our internal keys to TradingView symbols */
export const TV_SYMBOL_MAP = {
  'gram_altin':   'FX_IDC:XAUTRY',
  'usd_try':     'FX:USDTRY',
  'eur_try':     'FX:EURTRY',
  'gbp_try':     'FX:GBPTRY',
  'ceyrek_altin': 'FX_IDC:XAUTRY', // Fallback to gold spot
  'tam_altin':    'FX_IDC:XAUTRY',
  'bilezik_22':   'FX_IDC:XAUTRY',
};
