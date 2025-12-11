// Utilidades para Vercel Analytics
// Solo disponible en producción

/**
 * Trackea un evento personalizado en Vercel Analytics
 * @param {string} name - Nombre del evento
 * @param {object} properties - Propiedades del evento
 */
export const trackEvent = (name, properties = {}) => {
  // Solo ejecutar en producción

    return;
  }

  try {
    // Verificar que window.va existe y tiene el método track
    if (window.va && typeof window.va.track === 'function') {
      window.va.track(name, properties);
    } else {
      // Silenciosamente ignorar si Vercel Analytics no está disponible
      // No mostrar warning en producción para evitar ruido en la consola
      if (process.env.NODE_ENV === 'development') {
      }
    }
  } catch (error) {
    // Solo mostrar errores en desarrollo, silenciosamente ignorar en producción
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [ANALYTICS] Error trackeando evento:', error);
    }
  }
};

/**
 * Trackea la descarga de un ticket
 * @param {string} locator - Localizador del ticket
 * @param {string} method - Método de descarga (download, download-simple)
 * @param {boolean} success - Si la descarga fue exitosa
 * @param {string} error - Error si falló
 */
export 
};

/**
 * Trackea errores de API
 * @param {string} endpoint - Endpoint que falló
 * @param {number} status - Status code del error
 * @param {string} error - Mensaje de error
 */
export 
};

/**
 * Trackea el uso de funcionalidades del backoffice
 * @param {string} feature - Nombre de la funcionalidad
 * @param {string} action - Acción realizada
 * @param {object} metadata - Metadatos adicionales
 */
export 
};

/**
 * Trackea la selección de asientos
 * @param {string} eventId - ID del evento
 * @param {string} functionId - ID de la función
 * @param {number} seatCount - Cantidad de asientos seleccionados
 * @param {string} zone - Zona seleccionada
 */
export 
};

/**
 * Trackea la finalización de una compra
 * @param {string} eventId - ID del evento
 * @param {number} total - Total de la compra
 * @param {number} seatCount - Cantidad de asientos
 * @param {string} paymentMethod - Método de pago
 */
export 
};
