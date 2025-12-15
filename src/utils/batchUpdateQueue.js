/**
 * Sistema de cola para batch updates optimizado para realtime
 * Agrupa múltiples actualizaciones en una sola operación
 */

class BatchUpdateQueue {
  constructor(options = {}) {
    this.queue = new Map();
    this.timeout = null;
    this.maxBatchSize = options.maxBatchSize || 50;
    this.maxWaitTime = options.maxWaitTime || 100; // ms
    this.processCallback = options.processCallback || null;
    this.priorityQueue = new Map(); // Updates de alta prioridad
  }

  /**
   * Agrega una actualización a la cola
   * @param {string} key - Clave única para la actualización
   * @param {*} value - Valor a actualizar
   * @param {boolean} priority - Si es true, se procesa con mayor prioridad
   */
  add(key, value, priority = false) {
    if (priority) {
      this.priorityQueue.set(key, value);
    } else {
      this.queue.set(key, value);
    }

    // Si la cola está llena, procesar inmediatamente
    if (this.queue.size + this.priorityQueue.size >= this.maxBatchSize) {
      return;
    }

    // Programar procesamiento si no hay timeout activo
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.maxWaitTime);
    }
  }

  /**
   * Procesa todas las actualizaciones en la cola
   */
  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // Combinar colas (prioridad primero)
    const allUpdates = new Map([...this.priorityQueue, ...this.queue]);

    if (allUpdates.size === 0) {
      return;
    }

    // Convertir a objeto plano para el callback
    const updates = Object.fromEntries(allUpdates);

    // Procesar actualizaciones
    if (this.processCallback) {
      this.processCallback(updates);
    }

    // Limpiar colas
    this.queue.clear();
    this.priorityQueue.clear();
  }

  /**
   * Limpia la cola sin procesar
   */
  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue.clear();
    this.priorityQueue.clear();
  }

  /**
   * Obtiene el tamaño actual de la cola
   */
  size() {
    return this.queue.size + this.priorityQueue.size;
  }
}

export default BatchUpdateQueue;
