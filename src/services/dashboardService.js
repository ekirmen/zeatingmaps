import { supabase } from '../supabaseClient';

/**
 * Servicio optimizado para cargar datos del dashboard
 * Utiliza funciones RPC para reducir consultas N+1 y caché para mejorar performance
 */

// Caché en memoria con TTL
class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 2 * 60 * 1000; // 2 minutos por defecto
  }

  get(key) {
    if (!cached) return null;

    // Verificar si el cache expiró
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Limpiar cache expirado
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const dashboardCache = new DashboardCache();

// Limpiar cache expirado cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      dashboardCache.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Obtiene las estadísticas del dashboard usando función RPC
 * @param {string|null} tenantId - ID del tenant (opcional)
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.useCache - Usar caché (default: true)
 * @param {number} options.cacheTTL - TTL del caché en ms (default: 2 minutos)
 * @returns {Promise<Object>} Estadísticas del dashboard
 */
export async function getDashboardStats(tenantId = null, options = {}) {
  const { useCache = true, cacheTTL = 2 * 60 * 1000 } = options;
  const cacheKey = `dashboard_stats_${tenantId || 'all'}`;

  // Verificar caché
  if (useCache) {
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('Error calling get_dashboard_stats RPC:', error);
      throw error;
    }

    // Guardar en caché
    if (useCache && data) {
      dashboardCache.set(cacheKey, data, cacheTTL);
    }

    return (
      data || {
        totalEvents: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalRevenue: 0,
        recentEvents: [],
      }
    );
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    // Retornar valores por defecto en caso de error
    return {
      totalEvents: 0,
      totalUsers: 0,
      totalProducts: 0,
      totalRevenue: 0,
      recentEvents: [],
    };
  }
}

/**
 * Invalida el caché del dashboard
 * @param {string|null} tenantId - ID del tenant (opcional)
 */
export function invalidateDashboardCache(tenantId = null) {
  const cacheKey = tenantId ? `dashboard_stats_${tenantId}` : null;
  dashboardCache.clear(cacheKey);
}

/**
 * Carga datos del dashboard con lazy loading
 * @param {Object} options - Opciones de carga
 * @param {boolean} options.loadStats - Cargar estadísticas (default: true)
 * @param {boolean} options.loadRecentEvents - Cargar eventos recientes (default: true)
 * @param {number} options.recentEventsLimit - Límite de eventos recientes (default: 5)
 * @returns {Promise<Object>} Datos del dashboard
 */
export async function loadDashboardData(options = {}) {
  const {
    tenantId = null,
    loadStats = true,
    loadRecentEvents = true,
    recentEventsLimit = 5,
    useCache = true,
  } = options;

  const promises = [];

  // Cargar estadísticas si se solicita
  if (loadStats) {
    promises.push(getDashboardStats(tenantId, { useCache }));
  }

  // Cargar eventos recientes si se solicita (puede estar en stats o cargarse por separado)
  if (loadRecentEvents && !loadStats) {
    promises.push(
      supabase
        .from('eventos')
        .select('id, nombre, fecha, ubicacion, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(recentEventsLimit)
        .then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        })
    );
  }

  const results = await Promise.all(promises);

  if (loadStats && loadRecentEvents) {
    // Los eventos recientes están incluidos en stats
    return results[0];
  } else if (loadStats) {
    return { stats: results[0], recentEvents: [] };
  } else {
    return { stats: null, recentEvents: results[0] || [] };
  }
}

export default {
  getDashboardStats,
  invalidateDashboardCache,
  loadDashboardData,
};
