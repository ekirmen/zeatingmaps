/**
 * Utilidad para caché en IndexedDB
 * Almacena mapas y datos de eventos para acceso rápido y offline
 */

const DB_NAME = 'veneventos_cache';
const DB_VERSION = 1;
const STORES = {
  MAPAS: 'mapas',
  EVENTOS: 'eventos',
  FUNCIONES: 'funciones'
};

class IndexedDBCache {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[IndexedDB] IndexedDB no está disponible');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Error abriendo base de datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Base de datos inicializada');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para mapas
        if (!db.objectStoreNames.contains(STORES.MAPAS)) {
          const mapasStore = db.createObjectStore(STORES.MAPAS, { keyPath: 'id' });
          mapasStore.createIndex('sala_id', 'sala_id', { unique: false });
          mapasStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Store para eventos
        if (!db.objectStoreNames.contains(STORES.EVENTOS)) {
          const eventosStore = db.createObjectStore(STORES.EVENTOS, { keyPath: 'id' });
          eventosStore.createIndex('slug', 'slug', { unique: true });
          eventosStore.createIndex('tenant_id', 'tenant_id', { unique: false });
          eventosStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Store para funciones
        if (!db.objectStoreNames.contains(STORES.FUNCIONES)) {
          const funcionesStore = db.createObjectStore(STORES.FUNCIONES, { keyPath: 'id' });
          funcionesStore.createIndex('evento_id', 'evento_id', { unique: false });
          funcionesStore.createIndex('sala_id', 'sala_id', { unique: false });
          funcionesStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        console.log('[IndexedDB] Stores creados');
      };
    });

    return this.initPromise;
  }

  /**
   * Obtiene un mapa desde el caché
   * @param {number|string} salaId - ID de la sala
   * @returns {Promise<object|null>} - Datos del mapa o null si no existe
   */
  async getMapa(salaId) {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.MAPAS], 'readonly');
      const store = transaction.objectStore(STORES.MAPAS);
      const index = store.index('sala_id');
      const request = index.getAll(salaId);

      request.onsuccess = () => {
        const mapas = request.result;
        if (mapas && mapas.length > 0) {
          // Retornar el más reciente
          const mapa = mapas.sort((a, b) => 
            new Date(b.updated_at || b.cached_at) - new Date(a.updated_at || a.cached_at)
          )[0];
          
          // Verificar si el caché es válido (24 horas)
          const cacheAge = Date.now() - new Date(mapa.cached_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas
          
          if (cacheAge > maxAge) {
            console.log('[IndexedDB] Caché de mapa expirado');
            resolve(null);
          } else {
            console.log('[IndexedDB] Mapa obtenido del caché');
            resolve(mapa.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error obteniendo mapa:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Guarda un mapa en el caché
   * @param {number|string} salaId - ID de la sala
   * @param {object} mapaData - Datos del mapa
   * @param {number} mapaId - ID del mapa (opcional)
   * @returns {Promise<void>}
   */
  async setMapa(salaId, mapaData, mapaId = null) {
    await this.init();
    if (!this.db || !mapaData) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.MAPAS], 'readwrite');
      const store = transaction.objectStore(STORES.MAPAS);
      
      const cacheEntry = {
        id: mapaId || `mapa_${salaId}_${Date.now()}`,
        sala_id: salaId,
        data: mapaData,
        cached_at: new Date().toISOString(),
        updated_at: mapaData.updated_at || mapaData.created_at || new Date().toISOString()
      };

      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        console.log('[IndexedDB] Mapa guardado en caché');
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error guardando mapa:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Obtiene un evento desde el caché
   * @param {string} eventSlug - Slug del evento
   * @returns {Promise<object|null>} - Datos del evento o null si no existe
   */
  async getEvento(eventSlug) {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.EVENTOS], 'readonly');
      const store = transaction.objectStore(STORES.EVENTOS);
      const index = store.index('slug');
      const request = index.get(eventSlug);

      request.onsuccess = () => {
        const evento = request.result;
        if (evento) {
          // Verificar si el caché es válido (1 hora)
          const cacheAge = Date.now() - new Date(evento.cached_at).getTime();
          const maxAge = 60 * 60 * 1000; // 1 hora
          
          if (cacheAge > maxAge) {
            console.log('[IndexedDB] Caché de evento expirado');
            resolve(null);
          } else {
            console.log('[IndexedDB] Evento obtenido del caché');
            resolve(evento.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error obteniendo evento:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Guarda un evento en el caché
   * @param {object} eventoData - Datos del evento
   * @returns {Promise<void>}
   */
  async setEvento(eventoData) {
    await this.init();
    if (!this.db || !eventoData || !eventoData.slug) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.EVENTOS], 'readwrite');
      const store = transaction.objectStore(STORES.EVENTOS);
      
      const cacheEntry = {
        id: eventoData.id,
        slug: eventoData.slug,
        tenant_id: eventoData.tenant_id,
        data: eventoData,
        cached_at: new Date().toISOString(),
        updated_at: eventoData.updated_at || eventoData.created_at || new Date().toISOString()
      };

      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        console.log('[IndexedDB] Evento guardado en caché');
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error guardando evento:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Obtiene funciones de un evento desde el caché
   * @param {number|string} eventoId - ID del evento
   * @returns {Promise<Array>} - Array de funciones o array vacío
   */
  async getFunciones(eventoId) {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.FUNCIONES], 'readonly');
      const store = transaction.objectStore(STORES.FUNCIONES);
      const index = store.index('evento_id');
      const request = index.getAll(eventoId);

      request.onsuccess = () => {
        const funciones = request.result;
        if (funciones && funciones.length > 0) {
          // Verificar si el caché es válido (30 minutos)
          const validFunciones = funciones.filter(funcion => {
            const cacheAge = Date.now() - new Date(funcion.cached_at).getTime();
            const maxAge = 30 * 60 * 1000; // 30 minutos
            return cacheAge <= maxAge;
          });

          if (validFunciones.length > 0) {
            console.log('[IndexedDB] Funciones obtenidas del caché');
            resolve(validFunciones.map(f => f.data));
          } else {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error obteniendo funciones:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Guarda funciones en el caché
   * @param {number|string} eventoId - ID del evento
   * @param {Array} funcionesData - Array de funciones
   * @returns {Promise<void>}
   */
  async setFunciones(eventoId, funcionesData) {
    await this.init();
    if (!this.db || !funcionesData || !Array.isArray(funcionesData)) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.FUNCIONES], 'readwrite');
      const store = transaction.objectStore(STORES.FUNCIONES);
      
      // Eliminar funciones antiguas del mismo evento
      const index = store.index('evento_id');
      const deleteRequest = index.openCursor(IDBKeyRange.only(eventoId));
      
      deleteRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Guardar nuevas funciones
          const promises = funcionesData.map(funcion => {
            const cacheEntry = {
              id: funcion.id,
              evento_id: eventoId,
              sala_id: funcion.sala_id || funcion.sala,
              data: funcion,
              cached_at: new Date().toISOString(),
              updated_at: funcion.updated_at || funcion.created_at || new Date().toISOString()
            };
            return store.put(cacheEntry);
          });

          Promise.all(promises).then(() => {
            console.log('[IndexedDB] Funciones guardadas en caché');
            resolve();
          }).catch(reject);
        }
      };

      deleteRequest.onerror = () => {
        console.error('[IndexedDB] Error eliminando funciones antiguas:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  }

  /**
   * Limpia el caché expirado
   * @param {number} maxAge - Edad máxima en ms (default: 7 días)
   * @returns {Promise<void>}
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) {
    await this.init();
    if (!this.db) return;

    const cleanupStore = (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('updated_at');
        const request = index.openCursor();
        const cutoffTime = new Date(Date.now() - maxAge).toISOString();
        let deleted = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value.cached_at < cutoffTime) {
              cursor.delete();
              deleted++;
            }
            cursor.continue();
          } else {
            console.log(`[IndexedDB] Limpieza de ${storeName}: ${deleted} entradas eliminadas`);
            resolve(deleted);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    };

    try {
      await Promise.all([
        cleanupStore(STORES.MAPAS),
        cleanupStore(STORES.EVENTOS),
        cleanupStore(STORES.FUNCIONES)
      ]);
      console.log('[IndexedDB] Limpieza completada');
    } catch (error) {
      console.error('[IndexedDB] Error en limpieza:', error);
    }
  }

  /**
   * Limpia todo el caché
   * @returns {Promise<void>}
   */
  async clear() {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.MAPAS, STORES.EVENTOS, STORES.FUNCIONES], 'readwrite');
      
      transaction.oncomplete = () => {
        console.log('[IndexedDB] Caché limpiado');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };

      transaction.objectStore(STORES.MAPAS).clear();
      transaction.objectStore(STORES.EVENTOS).clear();
      transaction.objectStore(STORES.FUNCIONES).clear();
    });
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {Promise<Object>} - Estadísticas del caché
   */
  async getStats() {
    await this.init();
    if (!this.db) return { mapas: 0, eventos: 0, funciones: 0 };

    const getCount = (storeName) => {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(0);
        };
      });
    };

    const [mapas, eventos, funciones] = await Promise.all([
      getCount(STORES.MAPAS),
      getCount(STORES.EVENTOS),
      getCount(STORES.FUNCIONES)
    ]);

    return { mapas, eventos, funciones };
  }
}

// Instancia global del caché
const indexedDBCache = new IndexedDBCache();

export default indexedDBCache;

