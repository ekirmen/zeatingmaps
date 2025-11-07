/**
 * Rate Limiter para requests de API
 * Previene abuso de API y múltiples requests simultáneos
 */

class ApiRateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 30; // Máximo de requests
    this.windowMs = options.windowMs || 60000; // Ventana de tiempo (1 minuto)
    this.requestHistory = []; // Array de timestamps de requests
    this.pendingRequests = new Map(); // Map<requestKey, timestamp>
    this.blockedEndpoints = new Set(); // Set de endpoints temporalmente bloqueados
    this.perEndpointLimit = options.perEndpointLimit || 10; // Límite por endpoint
    this.endpointHistory = new Map(); // Map<endpoint, Array<timestamps>>
  }

  /**
   * Verifica si un request está permitido
   * @param {string} endpoint - Endpoint de la API
   * @param {string} requestKey - Clave única del request (opcional)
   * @returns {boolean} - true si el request está permitido
   */
  canMakeRequest(endpoint, requestKey = null) {
    const now = Date.now();

    // Limpiar historial de requests antiguos
    this.requestHistory = this.requestHistory.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Verificar límite global
    if (this.requestHistory.length >= this.maxRequests) {
      console.warn(
        `[API_RATE_LIMITER] Límite global excedido: ${this.requestHistory.length} requests en ${this.windowMs}ms`
      );
      return false;
    }

    // Verificar límite por endpoint
    if (!this.endpointHistory.has(endpoint)) {
      this.endpointHistory.set(endpoint, []);
    }

    const endpointRequests = this.endpointHistory.get(endpoint).filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (endpointRequests.length >= this.perEndpointLimit) {
      console.warn(
        `[API_RATE_LIMITER] Límite por endpoint excedido: ${endpointRequests.length} requests para ${endpoint} en ${this.windowMs}ms`
      );
      this.blockedEndpoints.add(endpoint);
      
      // Desbloquear después de la ventana de tiempo
      setTimeout(() => {
        this.blockedEndpoints.delete(endpoint);
      }, this.windowMs);

      return false;
    }

    // Verificar si el endpoint está bloqueado
    if (this.blockedEndpoints.has(endpoint)) {
      console.warn(`[API_RATE_LIMITER] Endpoint bloqueado temporalmente: ${endpoint}`);
      return false;
    }

    // Verificar request duplicado (si se proporciona requestKey)
    if (requestKey) {
      const lastRequest = this.pendingRequests.get(requestKey);
      if (lastRequest && now - lastRequest < 1000) {
        console.warn(`[API_RATE_LIMITER] Request duplicado bloqueado: ${requestKey}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Registra un request
   * @param {string} endpoint - Endpoint de la API
   * @param {string} requestKey - Clave única del request (opcional)
   * @returns {boolean} - true si el request fue registrado
   */
  registerRequest(endpoint, requestKey = null) {
    if (!this.canMakeRequest(endpoint, requestKey)) {
      return false;
    }

    const now = Date.now();
    this.requestHistory.push(now);

    if (!this.endpointHistory.has(endpoint)) {
      this.endpointHistory.set(endpoint, []);
    }
    this.endpointHistory.get(endpoint).push(now);

    if (requestKey) {
      this.pendingRequests.set(requestKey, now);
      
      // Limpiar después de 1 segundo
      setTimeout(() => {
        this.pendingRequests.delete(requestKey);
      }, 1000);
    }

    return true;
  }

  /**
   * Limpia el estado de un endpoint específico
   * @param {string} endpoint - Endpoint de la API
   */
  clearEndpoint(endpoint) {
    this.endpointHistory.delete(endpoint);
    this.blockedEndpoints.delete(endpoint);
  }

  /**
   * Limpia todo el estado de rate limiting
   */
  clear() {
    this.requestHistory = [];
    this.pendingRequests.clear();
    this.blockedEndpoints.clear();
    this.endpointHistory.clear();
  }

  /**
   * Obtiene estadísticas de rate limiting
   * @returns {Object} - Estadísticas de requests
   */
  getStats() {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      timestamp => now - timestamp < this.windowMs
    );

    const endpointStats = {};
    this.endpointHistory.forEach((timestamps, endpoint) => {
      const recent = timestamps.filter(t => now - t < this.windowMs);
      endpointStats[endpoint] = {
        total: timestamps.length,
        recent: recent.length,
        limit: this.perEndpointLimit
      };
    });

    return {
      totalRequests: this.requestHistory.length,
      recentRequests: recentRequests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      blockedEndpoints: Array.from(this.blockedEndpoints),
      pendingRequests: this.pendingRequests.size,
      endpointStats
    };
  }

  /**
   * Obtiene el tiempo de espera hasta el próximo request permitido
   * @param {string} endpoint - Endpoint de la API
   * @returns {number} - Tiempo de espera en ms (0 si está disponible)
   */
  getWaitTime(endpoint) {
    const now = Date.now();
    
    // Si el endpoint está bloqueado, retornar tiempo restante
    if (this.blockedEndpoints.has(endpoint)) {
      return this.windowMs;
    }

    // Verificar límite por endpoint
    if (this.endpointHistory.has(endpoint)) {
      const endpointRequests = this.endpointHistory.get(endpoint).filter(
        timestamp => now - timestamp < this.windowMs
      );

      if (endpointRequests.length >= this.perEndpointLimit) {
        const oldestRequest = Math.min(...endpointRequests);
        return Math.max(0, this.windowMs - (now - oldestRequest));
      }
    }

    // Verificar límite global
    if (this.requestHistory.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requestHistory);
      return Math.max(0, this.windowMs - (now - oldestRequest));
    }

    return 0;
  }
}

// Instancia global para rate limiting de API
const globalApiRateLimiter = new ApiRateLimiter({
  maxRequests: 30, // Máximo 30 requests por minuto
  windowMs: 60000, // Ventana de 1 minuto
  perEndpointLimit: 10 // Máximo 10 requests por endpoint por minuto
});

export default globalApiRateLimiter;
export { ApiRateLimiter };

