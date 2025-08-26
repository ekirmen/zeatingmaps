// Utilidades para Vercel Analytics
// Solo disponible en producción

/**
 * Trackea un evento personalizado en Vercel Analytics
 * @param {string} name - Nombre del evento
 * @param {object} properties - Propiedades del evento
 */
export const trackEvent = (name, properties = {}) => {
  // Solo ejecutar en producción
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [ANALYTICS] Evento trackeado (desarrollo):', { name, properties });
    return;
  }

  try {
    // Usar la API de Vercel Analytics si está disponible
    if (window.va) {
      window.va.track(name, properties);
      console.log('📊 [ANALYTICS] Evento trackeado:', { name, properties });
    } else {
      console.warn('⚠️ [ANALYTICS] Vercel Analytics no disponible');
    }
  } catch (error) {
    console.error('❌ [ANALYTICS] Error trackeando evento:', error);
  }
};

/**
 * Trackea la descarga de un ticket
 * @param {string} locator - Localizador del ticket
 * @param {string} method - Método de descarga (download, download-simple)
 * @param {boolean} success - Si la descarga fue exitosa
 * @param {string} error - Error si falló
 */
export const trackTicketDownload = (locator, method, success, error = null) => {
  trackEvent('ticket_download', {
    locator,
    method,
    success,
    error,
    timestamp: new Date().toISOString()
  });
};

/**
 * Trackea errores de API
 * @param {string} endpoint - Endpoint que falló
 * @param {number} status - Status code del error
 * @param {string} error - Mensaje de error
 */
export const trackApiError = (endpoint, status, error) => {
  trackEvent('api_error', {
    endpoint,
    status,
    error,
    timestamp: new Date().toISOString()
  });
};

/**
 * Trackea el uso de funcionalidades del backoffice
 * @param {string} feature - Nombre de la funcionalidad
 * @param {string} action - Acción realizada
 * @param {object} metadata - Metadatos adicionales
 */
export const trackBackofficeUsage = (feature, action, metadata = {}) => {
  trackEvent('backoffice_usage', {
    feature,
    action,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

/**
 * Trackea la selección de asientos
 * @param {string} eventId - ID del evento
 * @param {string} functionId - ID de la función
 * @param {number} seatCount - Cantidad de asientos seleccionados
 * @param {string} zone - Zona seleccionada
 */
export const trackSeatSelection = (eventId, functionId, seatCount, zone) => {
  trackEvent('seat_selection', {
    eventId,
    functionId,
    seatCount,
    zone,
    timestamp: new Date().toISOString()
  });
};

/**
 * Trackea la finalización de una compra
 * @param {string} eventId - ID del evento
 * @param {number} total - Total de la compra
 * @param {number} seatCount - Cantidad de asientos
 * @param {string} paymentMethod - Método de pago
 */
export const trackPurchaseCompletion = (eventId, total, seatCount, paymentMethod) => {
  trackEvent('purchase_completion', {
    eventId,
    total,
    seatCount,
    paymentMethod,
    timestamp: new Date().toISOString()
  });
};
