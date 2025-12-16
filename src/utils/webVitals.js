/**
 * Utilidad para medir y reportar Core Web Vitals
 * LCP, INP, CLS, FCP, TTFB
 */
import { onCLS, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

/**
 * Reporta métricas de Core Web Vitals
 * @param {Function} onPerfEntry - Callback para recibir las métricas
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Largest Contentful Paint (LCP)
    onLCP(onPerfEntry);

    // Cumulative Layout Shift (CLS)
    onCLS(onPerfEntry);

    // First Contentful Paint (FCP)
    onFCP(onPerfEntry);

    // Time to First Byte (TTFB)
    onTTFB(onPerfEntry);

    // Interaction to Next Paint (INP) - reemplaza a FID (First Input Delay)
    onINP(onPerfEntry);
  }
};

/**
 * Envía métricas a un endpoint de analytics
 */
const sendToAnalytics = (metric) => {
  // Enviar a Vercel Analytics si está disponible
  if (window.va) {
    window.va('track', 'Web Vitals', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // También enviar a Supabase si se necesita
  // Esto se puede implementar más adelante si es necesario
  if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_ENABLE_WEB_VITALS === 'true') {
    // Implementar envío a Supabase
  }
};

/**
 * Obtiene el rating de una métrica
 */
const VITAL_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1000, needsImprovement: 2500 },
  TTFB: { good: 200, needsImprovement: 500 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 }
};

const getMetricRating = (metric) => {
  const name = (metric.name || '').toUpperCase();
  const thresholds = VITAL_THRESHOLDS[name];
  const value = metric.value;
  if (!thresholds || value === undefined || value === null) return 'unknown';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

// Attach rating before sending
const safeSendToAnalytics = (metric) => {
  try {
    const rating = getMetricRating(metric);
    const payload = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating,
      delta: metric.delta
    };

    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'Web Vitals', payload);
    }
  } catch (e) {
    // noop
  }
};

export { reportWebVitals, sendToAnalytics, getMetricRating, VITAL_THRESHOLDS };
export default reportWebVitals;

