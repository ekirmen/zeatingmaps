import { supabase } from '../supabaseClient';

// Use a fallback logger if no global logger is provided (prevents build eslint no-undef)
const logger = (typeof window !== 'undefined' && window.logger)
  ? window.logger
  : (typeof global !== 'undefined' && global.logger)
    ? global.logger
    : console;

/**
 * Helper: Handle Supabase errors
 */
function handleError(error, operation) {
  logger.error(`[Supabase ${operation}] Error:`, error);
  throw new Error(error.message || `Error en ${operation}`);
}

/**
 * Helper: Ensure user is authenticated
 */
async function ensureAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Usuario no autenticado');
  }
  return user;
}

// =====================================================
// EXISTING FUNCTIONS (Preserved)
// =====================================================

// ✅ fetchMapa SIN usar relaciones automáticas
export const fetchMapa = async (salaId) => {
  if (!salaId) {
    logger.log('❌ [fetchMapa] No se proporcionó salaId');
    return null;
  }

  logger.log('🔍 [fetchMapa] Buscando mapa para sala:', salaId);

  try {
    const { data, error } = await supabase
      .from('mapas')
      .select('*') // no necesitas joins
      .eq('sala_id', salaId)
      .maybeSingle();

    if (error) {
      logger.error('❌ [fetchMapa] Error al buscar mapa:', error);
      throw error;
    }

    if (!data) {
      logger.warn('⚠️ [fetchMapa] No se encontró mapa para la sala:', salaId);
      return null;
    }

    logger.log('✅ [fetchMapa] Mapa encontrado:', {
      id: data.id,
      sala_id: data.sala_id,
      nombre: data.nombre,
      contenido_tipo: typeof data.contenido,
      contenido_longitud: Array.isArray(data.contenido) ? data.contenido.length : 'N/A'
    });

    return data; // data.contenido ya contiene el JSON embebido
  } catch (error) {
    logger.error('❌ [fetchMapa] Error inesperado:', error);
    throw error;
  }
};

export const fetchZonasPorSala = async (salaId) => {
  const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', salaId);
  if (error) throw error;
  return data;
};

export const fetchAbonoAvailableSeats = async (eventId) => {
  const { data, error } = await supabase
    .from('abonos')
    .select('seat_id')
    .eq('package_type', 'evento')
    .eq('evento', eventId)
    .eq('status', 'activo');
  if (error) throw error;
  return data.map(a => a.seat_id);
};

export const fetchEntradasPorRecinto = async (recintoId) => {
  const { data, error } = await supabase.from('entradas').select('*').eq('recinto', recintoId);
  if (error) throw error;
  return data;
};

export const fetchPlantillaPorFuncion = async (funcionId) => {
  const { data, error } = await supabase
    .from('plantillas')
    .select('*, detalles:jsonb')
    .eq('id', funcionId); //  ajusta según tu esquema
  if (error) throw error;
  return data?.[0] ?? null;
};

export const fetchAffiliates = async () => {
  const { data, error } = await supabase.from('affiliateusers').select('*, users:profiles(login)');
  if (error) throw error;
  return data.map(a => ({ ...a, user: a.users }));
};

// =====================================================
// NEW SERVICES (RLS-based CRUD)
// =====================================================

/**
 * Eventos Service
 */
export const eventosService = {
  async list(filters = {}) {
    try {
      let query = supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
      if (filters.estado) query = query.eq('estado', filters.estado);
      if (filters.search) {
        query = query.or(`nombre.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) handleError(error, 'list eventos');
      return data || [];
    } catch (error) {
      handleError(error, 'list eventos');
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) handleError(error, 'get evento');
      return data;
    } catch (error) {
      handleError(error, 'get evento');
    }
  },

  async getBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) handleError(error, 'get evento by slug');
      return data;
    } catch (error) {
      handleError(error, 'get evento by slug');
    }
  },

  async create(eventoData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('eventos')
        .insert(eventoData)
        .select()
        .single();

      if (error) handleError(error, 'create evento');
      return data;
    } catch (error) {
      handleError(error, 'create evento');
    }
  },

  async update(id, eventoData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('eventos')
        .update(eventoData)
        .eq('id', id)
        .select()
        .single();

      if (error) handleError(error, 'update evento');
      return data;
    } catch (error) {
      handleError(error, 'update evento');
    }
  },

  async delete(id) {
    try {
      await ensureAuth();

      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (error) handleError(error, 'delete evento');
      return { success: true };
    } catch (error) {
      handleError(error, 'delete evento');
    }
  }
};

/**
 * Funciones Service
 */
export const funcionesService = {
  async list(eventoId) {
    try {
      const { data, error } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento_id', eventoId)
        .order('fecha_celebracion', { ascending: true });

      if (error) handleError(error, 'list funciones');
      return data || [];
    } catch (error) {
      handleError(error, 'list funciones');
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('funciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) handleError(error, 'get funcion');
      return data;
    } catch (error) {
      handleError(error, 'get funcion');
    }
  },

  async create(funcionData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('funciones')
        .insert(funcionData)
        .select()
        .single();

      if (error) handleError(error, 'create funcion');
      return data;
    } catch (error) {
      handleError(error, 'create funcion');
    }
  },

  async update(id, funcionData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('funciones')
        .update(funcionData)
        .eq('id', id)
        .select()
        .single();

      if (error) handleError(error, 'update funcion');
      return data;
    } catch (error) {
      handleError(error, 'update funcion');
    }
  },

  async delete(id) {
    try {
      await ensureAuth();

      const { error } = await supabase
        .from('funciones')
        .delete()
        .eq('id', id);

      if (error) handleError(error, 'delete funcion');
      return { success: true };
    } catch (error) {
      handleError(error, 'delete funcion');
    }
  }
};

/**
 * Zonas Service (Enhanced)
 */
export const zonasService = {
  async list(salaId) {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', salaId)
        .order('nombre', { ascending: true });

      if (error) handleError(error, 'list zonas');
      return data || [];
    } catch (error) {
      handleError(error, 'list zonas');
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) handleError(error, 'get zona');
      return data;
    } catch (error) {
      handleError(error, 'get zona');
    }
  },

  async create(zonaData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('zonas')
        .insert(zonaData)
        .select()
        .single();

      if (error) handleError(error, 'create zona');
      return data;
    } catch (error) {
      handleError(error, 'create zona');
    }
  },

  async update(id, zonaData) {
    try {
      await ensureAuth();

      const { data, error } = await supabase
        .from('zonas')
        .update(zonaData)
        .eq('id', id)
        .select()
        .single();

      if (error) handleError(error, 'update zona');
      return data;
    } catch (error) {
      handleError(error, 'update zona');
    }
  },

  async delete(id) {
    try {
      await ensureAuth();

      const { error } = await supabase
        .from('zonas')
        .delete()
        .eq('id', id);

      if (error) handleError(error, 'delete zona');
      return { success: true };
    } catch (error) {
      handleError(error, 'delete zona');
    }
  }
};

/**
 * Mapas Service (Enhanced)
 */
export const mapasService = {
  async getBySalaId(salaId) {
    return fetchMapa(salaId); // Use existing function
  },

  async save(salaId, contenido) {
    try {
      await ensureAuth();

      // Try to update first
      const { data: existing } = await supabase
        .from('mapas')
        .select('id')
        .eq('sala_id', salaId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('mapas')
          .update({ contenido, updated_at: new Date().toISOString() })
          .eq('sala_id', salaId)
          .select()
          .single();

        if (error) handleError(error, 'update mapa');
        return data;
      } else {
        const { data, error } = await supabase
          .from('mapas')
          .insert({ sala_id: salaId, contenido })
          .select()
          .single();

        if (error) handleError(error, 'create mapa');
        return data;
      }
    } catch (error) {
      handleError(error, 'save mapa');
    }
  }
};

/**
 * Profiles Service
 */
export const profilesService = {
  async getCurrent() {
    try {
      const user = await ensureAuth();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) handleError(error, 'get current profile');
      return data;
    } catch (error) {
      handleError(error, 'get current profile');
    }
  },

  async updateCurrent(profileData) {
    try {
      const user = await ensureAuth();

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) handleError(error, 'update profile');
      return data;
    } catch (error) {
      handleError(error, 'update profile');
    }
  }
};

/**
 * Export all services as default
 */
export default {
  eventos: eventosService,
  funciones: funcionesService,
  zonas: zonasService,
  mapas: mapasService,
  profiles: profilesService,
};
