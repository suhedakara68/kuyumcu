// ============================================
// NOVENTRA PWA — TradingView Chart Component (Fix)
// ============================================

export class GoldChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
    this.series = null;
  }

  async init() {
    if (!this.container) return;
    
    await this.loadScript('https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js');

    const chartOptions = {
      width: this.container.clientWidth,
      height: this.container.clientHeight || 320,
      layout: {
        background: { type: 'solid', color: '#0B0B1E' }, // Tam karanlık arka plan
        textColor: '#D1D4DC',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false }, // Mobilde sayfa kaydırmayı bozmasın
      handleScale: { axisPressedMouseMove: { time: true, price: true } },
    };

    this.chart = LightweightCharts.createChart(this.container, chartOptions);
    
    this.series = this.chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  setData(data) {
    if (this.series && data && data.length > 0) {
      // Zaman sıralamasına göre dizildiğinden emin olalım
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      this.series.setData(sortedData);
      this.chart.timeScale().fitContent();
    }
  }

  update(pricePoint) {
    if (this.series) {
      this.series.update(pricePoint);
    }
  }

  handleResize() {
    if (this.chart && this.container) {
      this.chart.applyOptions({ 
        width: this.container.clientWidth,
        height: this.container.clientHeight 
      });
    }
  }

  loadScript(url) {
    return new Promise((resolve) => {
      if (window.LightweightCharts) return resolve();
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
}
