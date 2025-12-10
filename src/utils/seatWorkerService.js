/**
 * Servicio para interactuar con el Web Worker de cálculos de asientos
 */

class SeatWorkerService {
  constructor() {
    this.worker = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.initWorker();
  }

  /**
   * Inicializar el Web Worker
   */
  initWorker() {
    if (typeof Worker === 'undefined') {
      return;
    }

    try {
      // Crear worker - Compatible con Create React App
      // El worker debe estar en public/ para que funcione correctamente
      // En producción, usar ruta absoluta desde la raíz del dominio
      // Vercel rewrite maneja /store/seatCalculations.worker.js -> /seatCalculations.worker.js
      let workerUrl;
      if (process.env.NODE_ENV === 'production') {
        // En producción, detectar si estamos en un subdirectorio (store, backoffice, etc.)
        const pathname = window.location.pathname;
        const basePath = pathname.match(/^\/(store|backoffice|dashboard|saas)/)?.[0] || '';

        // Construir URL: basePath puede ser "/store" o ""
        // Si hay basePath, Vercel lo reescribe automáticamente a la raíz
        workerUrl = basePath
          ? `${window.location.origin}${basePath}/seatCalculations.worker.js`
          : `${window.location.origin}/seatCalculations.worker.js`;
      } else {
        // En desarrollo, usar ruta relativa
        workerUrl = process.env.PUBLIC_URL
          ? `${process.env.PUBLIC_URL}/seatCalculations.worker.js`
          : '/seatCalculations.worker.js';
      }
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        const { success, type, result, error, requestId } = e.data;

        if (requestId && this.pendingRequests.has(requestId)) {
          const { resolve, reject } = this.pendingRequests.get(requestId);
          this.pendingRequests.delete(requestId);

          if (success) {
            resolve(result);
          } else {
            reject(new Error(error || 'Error en worker'));
          }
        } else if (!requestId) {
          // Mensaje sin requestId (respuesta directa del worker sin sistema de requests)
          if (success) {
            // Buscar el primer request pendiente de este tipo
            const pendingRequest = Array.from(this.pendingRequests.values())[0];
            if (pendingRequest) {
              pendingRequest.resolve(result);
              this.pendingRequests.delete(Array.from(this.pendingRequests.keys())[0]);
            }
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('[SeatWorkerService] Error en worker:', error);
        // Rechazar todas las peticiones pendientes
        this.pendingRequests.forEach(({ reject }) => {
          reject(error);
        });
        this.pendingRequests.clear();
      };
    } catch (error) {
      console.error('[SeatWorkerService] Error al crear worker:', error);
      // Fallback: ejecutar cálculos en el hilo principal
    }
  }

  /**
   * Ejecutar cálculo en el worker
   */
  async execute(type, payload) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback: ejecutar en el hilo principal si el worker no está disponible
        try {
          const result = this.executeSync(type, payload);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }

      const requestId = ++this.requestId;
      this.pendingRequests.set(requestId, { resolve, reject });

      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout en worker'));
        }
      }, 30000);

      // Limpiar timeout cuando se resuelva
      const originalResolve = resolve;
      resolve = (value) => {
        clearTimeout(timeout);
        originalResolve(value);
      };

      const originalReject = reject;
      reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

      this.pendingRequests.set(requestId, { resolve, reject });

      this.worker.postMessage({
        type,
        payload,
        requestId
      });
    });
  }

  /**
   * Ejecutar cálculo de forma síncrona (fallback)
   */
  executeSync(type, payload) {
    // Implementación básica de fallback
    // En producción, podrías importar las funciones directamente
    throw new Error('Ejecución síncrona no implementada. Worker requerido.');
  }

  /**
   * Calcular distancias desde un punto de referencia
   */
  async calculateDistances(seats, referencePoint) {
    return this.execute('CALCULATE_DISTANCES', { seats, referencePoint });
  }

  /**
   * Procesar datos de asientos
   */
  async processSeatsData(seats, options = {}) {
    return this.execute('PROCESS_SEATS_DATA', { seats, options });
  }

  /**
   * Calcular zonas
   */
  async calculateZones(seats) {
    return this.execute('CALCULATE_ZONES', { seats });
  }

  /**
   * Filtrar y ordenar asientos
   */
  async filterAndSortSeats(seats, filters = {}, sortBy = null) {
    return this.execute('FILTER_AND_SORT_SEATS', { seats, filters, sortBy });
  }

  /**
   * Calcular grupos de asientos
   */
  async calculateSeatGroups(seats, groupSize) {
    return this.execute('CALCULATE_SEAT_GROUPS', { seats, groupSize });
  }

  /**
   * Terminar el worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
    }
  }
}

// Singleton
const seatWorkerService = new SeatWorkerService();

export default seatWorkerService;

