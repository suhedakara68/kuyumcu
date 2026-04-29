// ============================================
// NOVENTRA PWA — Technical Analysis (Safe Import)
// ============================================

/**
 * Calculates RSI and signals dynamically to prevent initial load crash
 */
export async function generateAnalysis(prices) {
  if (!prices || prices.length < 20) return null;

  try {
    // Import indicators only when needed
    const indicators = await import('technicalindicators');
    
    const rsi = indicators.rsi({ values: prices, period: 14 });
    const lastRsi = rsi[rsi.length - 1];
    
    let signal = 'NÖTR';
    let signalColor = '#8B8BA7';

    if (lastRsi < 30) { signal = 'GÜÇLÜ AL'; signalColor = '#2ecc71'; }
    else if (lastRsi > 70) { signal = 'GÜÇLÜ SAT'; signalColor = '#e74c3c'; }
    else if (lastRsi < 45) { signal = 'AL'; signalColor = '#27ae60'; }
    else if (lastRsi > 55) { signal = 'SAT'; signalColor = '#c0392b'; }

    return {
      rsi: lastRsi,
      signal,
      signalColor
    };
  } catch (e) {
    console.warn("Analysis library failed to load:", e);
    return null;
  }
}
