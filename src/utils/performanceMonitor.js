/**
 * Monitor de performance para Core Web Vitals
 * Mide y reporta métricas de rendimiento
 */
import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'web-vitals';

/**
 * Clase para monitorear performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }

  /**
   * Inicia el monitoreo de Core Web Vitals
   */
  startMonitoring(onMetric) {
    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.metrics.lcp = metric;
      this.reportMetric('LCP', metric, onMetric);
    });

    // First Input Delay (FID) - deprecated, usar INP
    getFID((metric) => {
      this.metrics.fid = metric;
      this.reportMetric('FID', metric, onMetric);
    });

    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.metrics.cls = metric;
      this.reportMetric('CLS', metric, onMetric);
    });

    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.metrics.fcp = metric;
      this.reportMetric('FCP', metric, onMetric);
    });

    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.metrics.ttfb = metric;
      this.reportMetric('TTFB', metric, onMetric);
    });

    // Interaction to Next Paint (INP) - nueva métrica
    if (getINP) {
      getINP((metric) => {
        this.metrics.inp = metric;
        this.reportMetric('INP', metric, onMetric);
      });
    }
  }

  /**
   * Reporta una métrica
   */
  reportMetric(name, metric, onMetric) {
    const rating = this.getRating(name, metric.value);
    
    const metricData = {
      name,
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
      entries: metric.entries,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    };

    console.log(`[Performance] ${name}:`, metricData);

    // Enviar a callback si existe
    if (onMetric) {
      onMetric(metricData);
    }

    // Enviar a analytics si está disponible
    this.sendToAnalytics(metricData);
  }

  /**
   * Obtiene el rating de una métrica
   */
  getRating(name, value) {
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
      INP: { good: 200, needsImprovement: 500 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Envía métricas a analytics
   */
  sendToAnalytics(metricData) {
    // Vercel Analytics
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'Web Vitals', metricData);
    }

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metricData.name, {
        event_category: 'Web Vitals',
        value: Math.round(metricData.name === 'CLS' ? metricData.value * 1000 : metricData.value),
        event_label: metricData.id,
        non_interaction: true,
      });
    }
  }

  /**
   * Obtiene todas las métricas recopiladas
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Obtiene un resumen de las métricas
   */
  getSummary() {
    const summary = {};
    Object.keys(this.metrics).forEach((key) => {
      const metric = this.metrics[key];
      summary[key] = {
        value: metric.value,
        rating: this.getRating(metric.name, metric.value),
      };
    });
    return summary;
  }

  /**
   * Limpia los observadores
   */
  cleanup() {
    this.observers.forEach((observer) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers = [];
  }
}

// Instancia singleton
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

