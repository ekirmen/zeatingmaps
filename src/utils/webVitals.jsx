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
export const getMetricRating = (value, thresholds) => {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Thresholds de Core Web Vitals
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
};

export { reportWebVitals, sendToAnalytics };
export default reportWebVitals;

