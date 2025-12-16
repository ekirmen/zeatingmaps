// Utilidades para Vercel Analytics (silenciosas si no están disponibles)

const safeTrack = (name, properties = {}) => {
  try {
    if (typeof window === 'undefined') return;
    if (window.va && typeof window.va.track === 'function') {
      window.va.track(name, properties);
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('[ANALYTICS] track error', e);
  }
};

export const trackEvent = (name, properties = {}) => {
  if (!name) return;
  safeTrack(name, properties);
};

export const trackTicketDownload = (locator, method = 'download', success = true, error = null) => {
  trackEvent('ticket_download', { locator, method, success, error });
};

export const trackApiError = (endpoint, status, errorMessage) => {
  trackEvent('api_error', { endpoint, status, errorMessage });
};

export const trackFeatureUsage = (feature, action, metadata = {}) => {
  trackEvent('feature_usage', { feature, action, ...metadata });
};

export const trackSeatSelection = (eventId, functionId, seatCount, zone) => {
  trackEvent('seat_selection', { eventId, functionId, seatCount, zone });
};

export const trackPurchaseComplete = (eventId, total, seatCount, paymentMethod) => {
  trackEvent('purchase_complete', { eventId, total, seatCount, paymentMethod });
};

export default {
  trackEvent,
  trackTicketDownload,
  trackApiError,
  trackFeatureUsage,
  trackSeatSelection,
  trackPurchaseComplete
};