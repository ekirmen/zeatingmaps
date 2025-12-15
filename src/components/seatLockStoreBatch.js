/**
 * Utilidades para optimizar batch updates en seatLockStore
 * Agrupa múltiples actualizaciones de estado para mejor performance
 */

import BatchUpdateQueue from '../utils/batchUpdateQueue';

/**
 * Batch update manager para seatLockStore
 */
class SeatLockBatchManager {
  constructor(updateCallback, options = {}) {
    this.updateQueue = new BatchUpdateQueue({
      maxBatchSize: options.maxBatchSize || 50,
      maxWaitTime: options.maxWaitTime || 100,
      processCallback: this.processBatch.bind(this),
    });
    this.updateCallback = updateCallback;
    this.visibleSeats = new Set(); // Asientos visibles en viewport
    this.prioritySeats = new Set(); // Asientos de alta prioridad (seleccionados, etc.)
  }

  /**
   * Procesa un batch de actualizaciones
   */
  processBatch(updates) {
    if (!this.updateCallback) return;

    // Separar updates por prioridad
    const priorityUpdates = {};
    const normalUpdates = {};

    Object.entries(updates).forEach(([seatId, state]) => {
      if (this.prioritySeats.has(seatId) || this.visibleSeats.has(seatId)) {
        priorityUpdates[seatId] = state;
      } else {
        normalUpdates[seatId] = state;
      }
    });

    // Procesar updates prioritarios primero
    if (Object.keys(priorityUpdates).length > 0) {
      this.updateCallback(priorityUpdates, true);
    }

    // Procesar updates normales después
    if (Object.keys(normalUpdates).length > 0) {
      // Usar requestIdleCallback si está disponible para no bloquear UI
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(
          () => {
            this.updateCallback(normalUpdates, false);
          },
          { timeout: 100 }
        );
      } else {
        // Fallback para navegadores sin requestIdleCallback
        setTimeout(() => {
          this.updateCallback(normalUpdates, false);
        }, 0);
      }
    }
  }

  /**
   * Agrega una actualización a la cola
   */
  addUpdate(seatId, state, priority = false) {
    // Si el asiento es visible o de alta prioridad, marcarlo
    if (priority) {
      this.prioritySeats.add(seatId);
    }

    this.updateQueue.add(seatId, state, priority);
  }

  /**
   * Marca asientos como visibles
   */
  setVisibleSeats(seatIds) {
    this.visibleSeats = new Set(seatIds);
  }

  /**
   * Marca asientos como de alta prioridad
   */
  setPrioritySeats(seatIds) {
    this.prioritySeats = new Set(seatIds);
  }

  /**
   * Limpia la cola
   */
  flush() {
    this.updateQueue.flush();
  }

  /**
   * Limpia todo
   */
  clear() {
    this.updateQueue.clear();
    this.visibleSeats.clear();
    this.prioritySeats.clear();
  }
}

export default SeatLockBatchManager;
