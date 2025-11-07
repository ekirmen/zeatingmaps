/**
 * Utilidad para throttling de clicks en asientos
 * Previene clicks rápidos y múltiples requests simultáneos
 */

class ClickThrottle {
  constructor(options = {}) {
    this.delay = options.delay || 300; // Delay mínimo entre clicks (ms)
    this.maxClicks = options.maxClicks || 10; // Máximo de clicks en una ventana de tiempo
    this.windowMs = options.windowMs || 5000; // Ventana de tiempo para maxClicks (ms)
    this.pendingClicks = new Map(); // Map<seatId, timestamp>
    this.clickHistory = []; // Array de timestamps de clicks recientes
    this.blockedSeats = new Set(); // Set de asientos temporalmente bloqueados
  }

  /**
   * Verifica si un click en un asiento está permitido
   * @param {string} seatId - ID del asiento
   * @returns {boolean} - true si el click está permitido, false si debe ser bloqueado
   */
  canClick(seatId) {
    const now = Date.now();

    // Limpiar historial de clicks antiguos
    this.clickHistory = this.clickHistory.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Verificar si se excedió el máximo de clicks en la ventana de tiempo
    if (this.clickHistory.length >= this.maxClicks) {
      console.warn(`[CLICK_THROTTLE] Rate limit excedido: ${this.clickHistory.length} clicks en ${this.windowMs}ms`);
      return false;
    }

    // Verificar si el asiento está bloqueado temporalmente
    if (this.blockedSeats.has(seatId)) {
      const lastClick = this.pendingClicks.get(seatId);
      if (lastClick && now - lastClick < this.delay) {
        console.warn(`[CLICK_THROTTLE] Click bloqueado para asiento ${seatId}: demasiado rápido`);
        return false;
      }
      // Desbloquear si ya pasó el delay
      this.blockedSeats.delete(seatId);
    }

    // Verificar delay mínimo desde el último click en este asiento
    const lastClickTime = this.pendingClicks.get(seatId);
    if (lastClickTime && now - lastClickTime < this.delay) {
      console.warn(`[CLICK_THROTTLE] Click bloqueado para asiento ${seatId}: delay mínimo no cumplido`);
      return false;
    }

    return true;
  }

  /**
   * Registra un click en un asiento
   * @param {string} seatId - ID del asiento
   * @returns {boolean} - true si el click fue registrado, false si fue bloqueado
   */
  registerClick(seatId) {
    if (!this.canClick(seatId)) {
      return false;
    }

    const now = Date.now();
    this.pendingClicks.set(seatId, now);
    this.clickHistory.push(now);

    // Bloquear temporalmente el asiento
    this.blockedSeats.add(seatId);

    // Limpiar el bloqueo después del delay
    setTimeout(() => {
      this.blockedSeats.delete(seatId);
    }, this.delay);

    return true;
  }

  /**
   * Limpia el estado de un asiento específico
   * @param {string} seatId - ID del asiento
   */
  clearSeat(seatId) {
    this.pendingClicks.delete(seatId);
    this.blockedSeats.delete(seatId);
  }

  /**
   * Limpia todo el estado de throttling
   */
  clear() {
    this.pendingClicks.clear();
    this.clickHistory = [];
    this.blockedSeats.clear();
  }

  /**
   * Obtiene estadísticas de throttling
   * @returns {Object} - Estadísticas de clicks
   */
  getStats() {
    const now = Date.now();
    const recentClicks = this.clickHistory.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return {
      totalClicks: this.clickHistory.length,
      recentClicks: recentClicks.length,
      maxClicks: this.maxClicks,
      windowMs: this.windowMs,
      blockedSeats: this.blockedSeats.size,
      pendingSeats: this.pendingClicks.size
    };
  }
}

// Instancia global para throttling de clicks
const globalClickThrottle = new ClickThrottle({
  delay: 300, // 300ms entre clicks
  maxClicks: 10, // Máximo 10 clicks en 5 segundos
  windowMs: 5000 // Ventana de 5 segundos
});

export default globalClickThrottle;
export { ClickThrottle };

