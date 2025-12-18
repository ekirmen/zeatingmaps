import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from '../../supabaseClient';
import { v5 as uuidv5 } from 'uuid';
import logger from '../../utils/logger';

// ============================================
// OPTIMIZACIONES: Funciones Helper Reutilizables
// ============================================

// Cache para tenant_id (evita múltiples consultas en la misma sesión)
let tenantIdCache = null;
let tenantIdCacheTimestamp = null;
const TENANT_ID_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene el tenant_id del usuario autenticado con cache
 * @returns {Promise<string>} tenant_id del usuario
 * @throws {Error} Si el usuario no está autenticado o no tiene tenant_id
 */
const getTenantId = async (useCache = true) => {
  // Verificar cache
  if (useCache && tenantIdCache && tenantIdCacheTimestamp) {
    const now = Date.now();
    if (now - tenantIdCacheTimestamp < TENANT_ID_CACHE_TTL) {
      return tenantIdCache;
    }
  }

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener tenant_id del perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.tenant_id) {
    throw new Error('Usuario sin tenant_id válido');
  }

  // Actualizar cache
  tenantIdCache = profile.tenant_id;
  tenantIdCacheTimestamp = Date.now();

  return tenantIdCache;
};

/**
 * Limpia el cache del tenant_id
 */
export const clearTenantIdCache = () => {
  tenantIdCache = null;
  tenantIdCacheTimestamp = null;
};

/**
 * Manejo de errores unificado
 */
const handleError = (error, context = '') => {
  if (error) {
    const errorMessage = context ? `${context}: ${error.message}` : error.message;
    logger.error('Supabase error:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Helper: verifica si una columna existe - versión simplificada sin information_schema
 */
async function hasColumn(tableName, columnName) {
  if (tableName === 'cms_pages') {
    if (columnName === 'created_at') return true;
    if (columnName === 'updated_at') return false;
    return false;
  }
  return false;
}

/**
 * Función genérica para obtener datos de una tabla con filtro por tenant_id
 */
const fetchByTenant = async (tableName, filters = {}, options = {}) => {
  try {
    const tenantId = await getTenantId();
    let query = supabase
      .from(tableName)
      .select(options.select || '*')
      .eq('tenant_id', tenantId);

    // Aplicar filtros adicionales
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Aplicar ordenamiento
    if (options.orderBy) {
      const ascending = options.ascending !== undefined ? options.ascending : true;
      query = query.order(options.orderBy, { ascending });
    }

    const { data, error } = await query;
    handleError(error, `Error fetching ${tableName}`);
    return data || [];
  } catch (error) {
    logger.error(`Error in fetchByTenant(${tableName}):`, error);
    throw error;
  }
};

/**
 * Función genérica para obtener un registro por ID con filtro por tenant_id
 */
const fetchById = async (tableName, id, options = {}) => {
  try {
    const tenantId = await getTenantId();
    let query = supabase
      .from(tableName)
      .select(options.select || '*')
      .eq('id', id)
      .eq('tenant_id', tenantId);

    const { data, error } = await query.single();
    handleError(error, `Error fetching ${tableName} by id`);
    return data;
  } catch (error) {
    logger.error(`Error in fetchById(${tableName}):`, error);
    throw error;
  }
};

/**
 * Función genérica para crear un registro con tenant_id automático
 */
const createRecord = async (tableName, data, options = {}) => {
  try {
    const tenantId = await getTenantId();
    const recordWithTenant = {
      ...data,
      tenant_id: tenantId
    };

    const { data: result, error } = await supabase
      .from(tableName)
      .insert([recordWithTenant])
      .select(options.select || '*')
      .single();

    handleError(error, `Error creating ${tableName}`);
    return result;
  } catch (error) {
    logger.error(`Error in createRecord(${tableName}):`, error);
    throw error;
  }
};

/**
 * Función genérica para actualizar un registro con validación de tenant_id
 */
const updateRecord = async (tableName, id, data, options = {}) => {
  try {
    const tenantId = await getTenantId();
    const recordWithTenant = {
      ...data,
      tenant_id: tenantId // Asegurar que se mantenga el tenant_id
    };

    const { data: result, error } = await supabase
      .from(tableName)
      .update(recordWithTenant)
      .eq('id', id)
      .eq('tenant_id', tenantId) // Solo actualizar registros del tenant actual
      .select(options.select || '*')
      .single();

    handleError(error, `Error updating ${tableName}`);
    return result;
  } catch (error) {
    logger.error(`Error in updateRecord(${tableName}):`, error);
    throw error;
  }
};

/**
 * Función genérica para eliminar un registro con validación de tenant_id
 */
const deleteRecord = async (tableName, id) => {
  try {
    const tenantId = await getTenantId();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId); // Solo eliminar registros del tenant actual

    handleError(error, `Error deleting ${tableName}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error in deleteRecord(${tableName}):`, error);
    throw error;
  }
};

// === ZONAS ===
export const fetchZonas = async () => {
  return fetchByTenant('zonas', {}, { orderBy: 'nombre' });
};

export const fetchZonasPorSala = async (salaId) => {
  if (!salaId) {
    throw new Error('salaId es requerido');
  }
  return fetchByTenant('zonas', { sala_id: salaId });
};

export const createZona = async (data) => {
  const client = supabaseAdmin || supabase;

  // Si no se proporciona tenant_id, intentar obtenerlo de la sala o usar el helper
  if (!data.tenant_id) {
    if (data.sala_id) {
      try {
        const { data: salaData, error: salaError } = await client
          .from('salas')
          .select('recintos!inner(tenant_id)')
          .eq('id', data.sala_id)
          .single();

        if (!salaError && salaData?.recintos?.tenant_id) {
          data.tenant_id = salaData.recintos.tenant_id;
        }
      } catch (error) {
        logger.warn('[createZona] No se pudo obtener tenant_id de la sala');
      }
    }

    // Si aún no hay tenant_id, usar el helper
    if (!data.tenant_id) {
      data.tenant_id = await getTenantId();
    }
  }

  const { data: result, error } = await client.from('zonas').insert(data).single();
  handleError(error, 'Error creating zona');
  return result;
};

export const updateZona = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const tenantId = await getTenantId();

  // Asegurar tenant_id en los datos
  if (!data.tenant_id) {
    data.tenant_id = tenantId;
  }

  const { data: result, error } = await client
    .from('zonas')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  handleError(error, 'Error updating zona');
  return result;
};

export const deleteZona = async (id) => {
  const client = supabaseAdmin || supabase;
  const tenantId = await getTenantId();
  const { error } = await client
    .from('zonas')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  handleError(error, 'Error deleting zona');
};

// === SALAS Y RECINTOS ===
export const fetchRecintos = async () => {
  const { data, error } = await supabase.from('recintos').select('*, salas(*)');
  handleError(error);
  return data;
};

export const createRecinto = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('recintos').insert(data).single();
  handleError(error);
  return result;
};

export const fetchSalas = async () => {
  const { data, error } = await supabase.from('salas').select('*');
  handleError(error);
  return data;
};

export const fetchSalasPorRecinto = async (recintoId) => {
  const { data, error } = await supabase.from('salas').select('*').eq('recinto_id', recintoId);
  handleError(error);
  return data;
};

export const fetchSalaById = async (salaId) => {
  const { data, error } = await supabase.from('salas').select('*').eq('id', salaId).single();
  handleError(error);
  return data;
};

export const createSala = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('salas').insert(data).single();
  handleError(error);
  return result;
};

// === EVENTOS ===
export const fetchEventos = async () => {
  const { data, error } = await supabase.from('eventos').select('*');
  handleError(error);
  return data;
};

export const fetchEventoById = async (id) => {
  const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single();
  handleError(error);
  return data;
};

export const createEvento = async (data) => {
  try {
    const client = supabaseAdmin || supabase;

    // Crear el evento
    const { data: result, error } = await client.from('eventos').insert(data).single();
    handleError(error);

    // Crear automáticamente la página CMS para el evento
    if (result) {
      logger.log('🔧 [createEvento] Evento creado, creando página CMS...');
      const cmsPage = await createCmsPageForEvent(result);
      if (cmsPage) {
        logger.log('✅ [createEvento] Página CMS creada exitosamente para evento:', result.nombre);
      } else {
        logger.warn('⚠️ [createEvento] No se pudo crear la página CMS para evento:', result.nombre);
      }
    }

    return result;
  } catch (error) {
    logger.error('❌ [createEvento] Error creando evento:', error);
    throw error;
  }
};

export const updateEvento = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('eventos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteEvento = async (id) => {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('eventos').delete().eq('id', id);
  handleError(error);
};

// === FUNCIONES ===
export const fetchFuncionesPorEvento = async (eventoId) => {
  const { data, error } = await supabase
    .from('funciones')
    .select('id, fecha_celebracion, inicio_venta, fin_venta, sala_id, evento_id')
    .eq('evento_id', eventoId);
  handleError(error);
  return data;
};

export const createFuncion = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('funciones').insert(data).single();
  handleError(error);
  return result;
};

// === MAPAS ===
export const fetchMapa = async (salaId, funcionId = null) => {
  if (!salaId) {
    logger.error('❌ [fetchMapa] salaId es null/undefined');
    return null;
  }

  logger.log('🔍 [fetchMapa] Iniciando búsqueda de mapa para sala:', salaId);
  logger.log('🔍 [fetchMapa] Tipo de salaId:', typeof salaId);
  logger.log('🔍 [fetchMapa] FuncionId:', funcionId);

  try {
    // Cargar el mapa
    logger.log('🔍 [fetchMapa] Buscando mapa en tabla mapas...');
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();

    logger.log('🔍 [fetchMapa] Resultado búsqueda mapa:', { mapa: mapa ? 'encontrado' : 'no encontrado', error: mapaError });

    if (mapaError) {
      logger.error('❌ [fetchMapa] Error al buscar mapa:', mapaError);
      logger.error('❌ [fetchMapa] Error details:', {
        code: mapaError.code,
        message: mapaError.message,
        details: mapaError.details,
        hint: mapaError.hint
      });
      throw mapaError;
    }

    if (!mapa) {
      logger.warn('⚠️ [fetchMapa] No se encontró mapa para sala:', salaId);
      return null;
    }

    logger.log('✅ [fetchMapa] Mapa encontrado:', { id: mapa.id, sala_id: mapa.sala_id });

    // Cargar las zonas de la sala
    logger.log('🔍 [fetchMapa] Buscando zonas para sala:', salaId);
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId);

    logger.log('🔍 [fetchMapa] Resultado búsqueda zonas:', { zonas: zonas?.length || 0, error: zonasError });

    if (zonasError) {
      logger.warn('⚠️ [fetchMapa] Error al cargar zonas, continuando sin zonas:', zonasError);
    }

    // Cargar asientos reservados/vendidos si se proporciona funcionId
    let reservedSeats = {};
    if (funcionId) {
      logger.log('🔍 [fetchMapa] Cargando asientos reservados para función:', funcionId);
      reservedSeats = await loadReservedSeats(funcionId);
    }

    // Aplicar estados de asientos reservados al mapa
    const mapaConEstados = applySeatStates(mapa, reservedSeats);

    // Retornar mapa con zonas incluidas y estados de asientos
    const resultado = {
      ...mapaConEstados,
      zonas: zonas || []
    };

    logger.log('✅ [fetchMapa] Retornando resultado final');
    return resultado;
  } catch (error) {
    logger.error('❌ [fetchMapa] Error general:', error);
    throw error;
  }
};

// Función para cargar asientos reservados desde payment_transactions
const loadReservedSeats = async (funcionId) => {
  try {
    logger.log('🔍 [loadReservedSeats] Cargando asientos reservados para función:', funcionId);

    // Buscar en la tabla payment_transactions (tabla principal)
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select('seats, status, funcion_id, locator, created_at, id')
      .eq('funcion_id', funcionId)
      .in('status', ['reservado', 'pagado', 'pending', 'completed', 'vendido', 'reserved'])
      .order('created_at', { ascending: false });

    if (paymentsError) {
      logger.error('❌ [loadReservedSeats] Error cargando payments:', paymentsError);
      return {};
    }

    logger.log('🔍 [loadReservedSeats] Payments encontrados:', payments?.length || 0);

    // Buscar en seat_locks para asientos bloqueados
    const { data: locks, error: locksError } = await supabase
      .from('seat_locks')
      .select('seat_id, status, expires_at, created_at, locator')
      .eq('funcion_id', funcionId)
      .eq('status', 'locked')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (locksError) {
      logger.warn('⚠️ [loadReservedSeats] Error cargando locks:', locksError);
    }

    logger.log('🔍 [loadReservedSeats] Locks encontrados:', locks?.length || 0);

    // Crear mapa de asientos reservados
    const reservedSeats = {};

    // Procesar payments
    if (payments) {
      payments.forEach(payment => {
        if (payment.seats && Array.isArray(payment.seats)) {
          payment.seats.forEach(seat => {
            if (seat.id) {
              let estado = 'disponible';
              if (payment.status === 'pagado' || payment.status === 'completed') {
                estado = 'vendido';
              } else if (payment.status === 'reservado' || payment.status === 'pending' || payment.status === 'reserved') {
                estado = 'reservado';
              }

              reservedSeats[seat.id] = {
                estado: estado,
                paymentId: payment.id,
                locator: payment.locator,
                createdAt: payment.created_at,
                status: payment.status
              };
              logger.log('✅ [loadReservedSeats] Asiento desde payments:', seat.id, 'Estado:', estado);
            }
          });
        }
      });
    }

    // Procesar locks
    if (locks) {
      locks.forEach(lock => {
        if (lock.seat_id) {
          reservedSeats[lock.seat_id] = {
            estado: 'bloqueado',
            lockId: lock.id,
            locator: lock.locator,
            createdAt: lock.created_at,
            expiresAt: lock.expires_at,
            status: 'locked'
          };
          logger.log('🔒 [loadReservedSeats] Asiento bloqueado:', lock.seat_id);
        }
      });
    }

    logger.log('✅ [loadReservedSeats] Total asientos con estado cargados:', Object.keys(reservedSeats).length);
    return reservedSeats;

  } catch (error) {
    logger.error('❌ [loadReservedSeats] Error general:', error);
    return {};
  }
};

// Función para asegurar que todos los asientos estén disponibles
const ensureAllSeatsAvailable = (mapa) => {
  if (!mapa || !mapa.contenido) {
    return mapa;
  }

  try {
    const contenido = Array.isArray(mapa.contenido) ? mapa.contenido : JSON.parse(mapa.contenido);

    const contenidoConEstados = contenido.map(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        const sillasConEstado = elemento.sillas.map(silla => ({
          ...silla,
          estado: 'disponible' // Forzar estado disponible
        }));

        return {
          ...elemento,
          sillas: sillasConEstado
        };
      }
      return elemento;
    });

    return {
      ...mapa,
      contenido: contenidoConEstados
    };

  } catch (error) {
    logger.error('❌ [ensureAllSeatsAvailable] Error:', error);
    return mapa;
  }
};

// Función para aplicar estados de asientos al mapa
const applySeatStates = (mapa, reservedSeats) => {
  if (!mapa || !mapa.contenido || Object.keys(reservedSeats).length === 0) {
    // Si no hay asientos reservados, asegurar que todos estén disponibles
    return ensureAllSeatsAvailable(mapa);
  }

  logger.log('🔍 [applySeatStates] Aplicando estados a mapa con', Object.keys(reservedSeats).length, 'asientos reservados');

  try {
    const contenido = Array.isArray(mapa.contenido) ? mapa.contenido : JSON.parse(mapa.contenido);

    // Recorrer el contenido del mapa y aplicar estados
    const contenidoConEstados = contenido.map(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        const sillasConEstado = elemento.sillas.map(silla => {
          const seatId = silla.id || silla._id;
          if (seatId && reservedSeats[seatId]) {
            return {
              ...silla,
              estado: reservedSeats[seatId].estado,
              transactionId: reservedSeats[seatId].transactionId,
              locator: reservedSeats[seatId].locator
            };
          }
          // Si no hay datos de reserva, asegurar que esté disponible
          return {
            ...silla,
            estado: 'disponible'
          };
        });

        return {
          ...elemento,
          sillas: sillasConEstado
        };
      }
      return elemento;
    });

    return {
      ...mapa,
      contenido: contenidoConEstados
    };

  } catch (error) {
    logger.error('❌ [applySeatStates] Error aplicando estados:', error);
    return mapa;
  }
};

export const saveMapa = async (salaId, data) => {
  if (!supabaseAdmin) {
    const resp = await fetch(`/api/mapas/${salaId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contenido: data.contenido || [],
        tenant_id: data.tenant_id,
        imagen_fondo: data.imagen_fondo // Add imagen_fondo
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Error al guardar mapa');
    }
    return;
  }
  const client = supabaseAdmin;
  const { error } = await client
    .from('mapas')
    .upsert({
      sala_id: salaId,
      contenido: data.contenido || [],
      tenant_id: data.tenant_id,
      imagen_fondo: data.imagen_fondo // Add imagen_fondo
    }, { onConflict: 'sala_id' });
  handleError(error);
};

export const syncSeatsForSala = async (salaId, options = {}) => {
  const deleteMissing = !!options.deleteMissing;
  if (!supabaseAdmin) {
    const query = deleteMissing ? '?syncOnly=1&deleteMissing=1' : '?syncOnly=1';
    const resp = await fetch(`/api/mapas/${salaId}/save${query}`, { method: 'POST' });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Error al sincronizar seats');
    }
    return;
  }
  // Rama admin directa: mantener comportamiento existente (inserciones básicas)
  const client = supabaseAdmin;
  const { data: mapa, error: mapaErr } = await client
    .from('mapas')
    .select('*')
    .eq('sala_id', salaId)
    .maybeSingle();
  handleError(mapaErr);
  if (!mapa || !Array.isArray(mapa.contenido)) return;

  const { data: funciones, error: funcErr } = await client
    .from('funciones')
    .select('id')
    .eq('sala', salaId);
  handleError(funcErr);
  if (!funciones || funciones.length === 0) return;

  const seatDefs = [];

  // Si el contenido es un array, procesarlo directamente
  // Si es un objeto, buscar la propiedad 'elementos'
  const elementos = Array.isArray(mapa.contenido)
    ? mapa.contenido
    : mapa.contenido.elementos || [];

  if (Array.isArray(elementos)) {
    elementos.forEach(el => {
      if (el.type === 'mesa') {
        (el.sillas || []).forEach(s => { if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || 'general' }); });
      } else if (el.type === 'silla') {
        if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || 'general' });
      }
    });
  }

  for (const func of funciones) {
    const { data: existing, error: exErr } = await client
      .from('seats')
      .select('_id')
      .eq('funcion_id', func.id);
    handleError(exErr);

    const existingIds = new Set((existing || []).map(s => s._id));
    const toInsert = seatDefs
      .filter(s => !existingIds.has(s.id))
      .map(s => ({
        _id: uuidv5(`${s.id}::${func.id}`, uuidv5.URL), // Generar UUID v5 válido
        funcion_id: func.id,
        zona: s.zona,
        status: 'disponible',
        bloqueado: false,
      }));

    if (toInsert.length > 0) {
      const { error: insErr } = await client
        .from('seats')
        .upsert(toInsert, { onConflict: 'funcion_id,_id', ignoreDuplicates: false });
      handleError(insErr);
    }
  }
};

// Bloquear o desbloquear varios asientos por ID
export const setSeatsBlocked = async (seatIds, bloqueado) => {
  const normalized = seatIds.map((id) =>
    typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id
  );
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('seats')
    .update({ bloqueado })
    .in('_id', normalized);

  handleError(error);
  return data;
};

// === ENTRADAS ===
export const fetchEntradas = async () => {
  try {
    return await fetchByTenant('entradas', {}, { orderBy: 'nombre_entrada' });
  } catch (error) {
    logger.error('Error in fetchEntradas:', error);
    return [];
  }
};

export const fetchEntradasByRecinto = async (recintoId) => {
  try {
    if (!recintoId) return [];
    return await fetchByTenant('entradas', { recinto: recintoId }, { orderBy: 'nombre_entrada' });
  } catch (error) {
    logger.error('Error in fetchEntradasByRecinto:', error);
    return [];
  }
};

export const fetchEntradaById = async (id) => {
  return fetchById('entradas', id);
};

export const createEntrada = async (data) => {
  return createRecord('entradas', data);
};

export const updateEntrada = async (id, data) => {
  return updateRecord('entradas', id, data);
};

export const deleteEntrada = async (id) => {
  return deleteRecord('entradas', id);
};

// Obtener página CMS por ID o slug
export const fetchCmsPage = async (identifier) => {
  // Verificar columnas (aunque no se usen directamente, se mantiene para compatibilidad futura)
  await Promise.all([
    hasColumn('cms_pages', 'created_at'),
    hasColumn('cms_pages', 'updated_at')
  ]);

  try {
    // Inicializar variables para evitar destructuración de null
    let data = null;
    let error = null;

    // Si el identificador es un número, buscar por ID
    if (!isNaN(identifier) && Number.isInteger(Number(identifier))) {
      logger.log(`🔍 [fetchCmsPage] Buscando página por ID: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('*')
        .eq('id', parseInt(identifier))
        .maybeSingle();
      data = result?.data || null;
      error = result?.error || null;
    } else {
      // Si es un string, buscar por slug
      logger.log(`🔍 [fetchCmsPage] Buscando página por slug: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('*')
        .ilike('slug', identifier)
        .maybeSingle();
      data = result?.data || null;
      error = result?.error || null;

      // Si no se encuentra por slug, buscar por nombre como fallback
      if (!data && !error) {
        logger.log(`🔍 [fetchCmsPage] Fallback: buscando por nombre: ${identifier}`);
        const fallback = await supabase
          .from('cms_pages')
          .select('*')
          .ilike('nombre', identifier)
          .maybeSingle();
        data = fallback?.data || null;
        error = fallback?.error || null;
      }
    }

    // Si se encuentra la página, retornarla
    if (data) {
      logger.log(`✅ [fetchCmsPage] Página encontrada: ${data.slug} (ID: ${data.id})`);
      return data;
    }

    // Si no se encuentra, NO crear página automáticamente
    if (!error) {
      logger.warn(`⚠️ [fetchCmsPage] Página no encontrada: ${identifier} - NO se creará automáticamente`);
      return null;
    }

    // Si hay error de Supabase, logearlo
    if (error) {
      logger.error('❌ [fetchCmsPage] Error de Supabase:', error);
      return null;
    }

    return null;
  } catch (error) {
    logger.error('❌ [fetchCmsPage] Error general:', error);
    return null;
  }
};

// Guardar widgets en una página CMS por slug o ID
export const saveCmsPage = async (identifier, widgets) => {
  try {
    const [, hasUpdatedAt] = await Promise.all([
      hasColumn('cms_pages', 'created_at'),
      hasColumn('cms_pages', 'updated_at')
    ]);

    let existingPage = null;
    let checkError = null;

    // Si el identificador es un número, buscar por ID
    if (!isNaN(identifier) && Number.isInteger(Number(identifier))) {
      logger.log(`🔍 [saveCmsPage] Buscando página por ID: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('id, slug')
        .eq('id', parseInt(identifier))
        .maybeSingle();
      existingPage = result?.data || null;
      checkError = result?.error || null;
    } else {
      // Si es un string, buscar por slug
      logger.log(`🔍 [saveCmsPage] Buscando página por slug: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('id, slug')
        .ilike('slug', identifier)
        .maybeSingle();
      existingPage = result?.data || null;
      checkError = result?.error || null;
    }

    if (checkError) {
      logger.error('❌ [saveCmsPage] Error checking page existence:', checkError);
      throw new Error('Error al verificar la página');
    }

    let result;
    const now = new Date().toISOString();

    if (existingPage) {
      // Actualizar página existente
      logger.log(`✅ [saveCmsPage] Actualizando página existente: ${existingPage.slug} (ID: ${existingPage.id})`);
      const updateData = { widgets };
      if (hasUpdatedAt) updateData.updated_at = now;

      result = await supabase
        .from('cms_pages')
        .update(updateData)
        .eq('id', existingPage.id);
    } else {
      // NO crear nueva página automáticamente
      logger.warn(`⚠️ [saveCmsPage] Página no encontrada: ${identifier} - NO se creará automáticamente`);
      throw new Error(`Página no encontrada: ${identifier}`);
    }

    if (result.error) {
      logger.error('❌ [saveCmsPage] Error al guardar página CMS:', result.error);
      throw new Error('Error al guardar la página');
    }

    logger.log(`✅ [saveCmsPage] Página guardada exitosamente: ${identifier}`);
    return result.data;
  } catch (error) {
    logger.error('❌ [saveCmsPage] Error general:', error);
    throw error;
  }
};

// === ABONOS ===
export const fetchAbonosByUser = async (userId) => {
  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('usuario_id', userId);
  handleError(error);
  return data;
};

export const createAbono = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('abonos').insert(data).single();
  handleError(error);
  return result;
};

export const renewAbono = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('abonos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const fetchPlantillasPorRecintoYSala = async (recintoId, salaId) => {
  const { data, error } = await supabase
    .from('plantillas')
    .select('*')
    .eq('recinto_id', recintoId)
    .eq('sala_id', salaId);

  if (error) {
    logger.error('Error al obtener plantillas:', error);
    throw new Error('No se pudieron cargar las plantillas');
  }

  return data;
};

export const fetchPlantillas = async () => {
  return fetchByTenant('plantillas', {}, { orderBy: 'nombre' });
};

export const fetchPlantillaById = async (id) => {
  return fetchById('plantillas', id);
};

export const createPlantilla = async (data) => {
  return createRecord('plantillas', data);
};

export const updatePlantilla = async (id, data) => {
  return updateRecord('plantillas', id, data);
};

export const deletePlantilla = async (id) => {
  return deleteRecord('plantillas', id);
};

// === PAYMENTS ===
// Función auxiliar para normalizar los asientos
const normalizeSeatObject = (seat) => {
  if (!seat || typeof seat !== 'object') return null;

  const seatIdRaw =
    seat.seat_id ||
    seat.id ||
    seat._id ||
    seat.sillaId ||
    seat.seatId ||
    seat.seat ||
    seat.tableSeatId ||
    seat.table_seat_id;

  const seatId =
    seatIdRaw == null
      ? null
      : typeof seatIdRaw === 'number'
        ? seatIdRaw.toString()
        : seatIdRaw.toString().trim();

  if (!seatId) {
    return { ...seat };
  }

  return {
    ...seat,
    id: seat.id || seatId,
    _id: seat._id || seatId,
    seat_id: seat.seat_id || seatId,
    seatId: seat.seatId || seatId
  };
};

const parseSeatsArray = (rawSeats) => {
  try {
    let seats = rawSeats;

    // Si es null o undefined, retornar array vacío
    if (seats == null) return [];

    // Si ya es un array, validar y retornar
    if (Array.isArray(seats)) {
      return seats
        .map(normalizeSeatObject)
        .filter(seat => seat && typeof seat === 'object');
    }

    // Si es string, intentar parsear
    if (typeof seats === 'string') {
      // Limpiar el string antes de parsear
      const cleanString = seats.trim();
      if (cleanString === '' || cleanString === 'null' || cleanString === 'undefined') {
        return [];
      }

      try {
        const parsed = JSON.parse(cleanString);
        // Si el resultado es un array, retornarlo
        if (Array.isArray(parsed)) {
          return parsed
            .map(normalizeSeatObject)
            .filter(seat => seat && typeof seat === 'object');
        }
        // Si es un objeto individual, envolverlo en array
        if (parsed && typeof parsed === 'object') {
          return [normalizeSeatObject(parsed)];
        }
        return [];
      } catch (parseError) {
        logger.error('Error parsing seats JSON string:', parseError);
        return [];
      }
    }

    // Si es un objeto individual, envolverlo en array
    if (seats && typeof seats === 'object' && !Array.isArray(seats)) {
      const normalizedSeat = normalizeSeatObject(seats);
      return normalizedSeat ? [normalizedSeat] : [];
    }

    return [];
  } catch (e) {
    logger.error('Error parsing seats data:', e);
    return [];
  }
};

export const createPayment = async (data) => {
  const client = supabaseAdmin || supabase;
  logger.log('createPayment request');

  // Validar que los asientos no estén ya vendidos
  const seats = parseSeatsArray(data.seats);
  if (seats.length > 0) {
    const funcionId = data.funcion ?? data.funcion_id ?? data.funcionId;

    logger.log('🔍 Validando asientos antes de crear pago:', { seatsCount: seats.length, funcionId });

    if (!funcionId) {
      logger.warn('⚠️ [createPayment] Función no proporcionada, se omite validación de asientos.');
    } else {
      for (const seat of seats) {
        const existingPayment = await fetchPaymentBySeat(funcionId, seat.id);
        if (
          existingPayment &&
          ['pagado', 'paid', 'completed', 'vendido'].includes(
            (existingPayment.status || '').toLowerCase()
          )
        ) {
          throw new Error(`El asiento ${seat.id} ya está vendido (locator: ${existingPayment.locator})`);
        }

        // También verificar asientos reservados
        if (
          existingPayment &&
          ['reservado', 'reserved'].includes((existingPayment.status || '').toLowerCase())
        ) {
          throw new Error(`El asiento ${seat.id} ya está reservado (locator: ${existingPayment.locator})`);
        }
      }
    }
  }

  // Asegurar que seats se almacene como JSON válido
  const seatsForDB = parseSeatsArray(data.seats);

  // Validar que los asientos tengan la estructura correcta
  const validatedSeats = seatsForDB.map(seat => {
    if (!seat.id && !seat._id && !seat.seat_id) {
      throw new Error(`Asiento sin ID válido: ${JSON.stringify(seat)}`);
    }

    const seatId = seat.seat_id || seat.id || seat._id;
    return {
      id: seatId,
      _id: seat._id || seatId,
      seat_id: seat.seat_id || seatId,
      seatId: seat.seatId || seatId,
      name: seat.name || seat.nombre || 'Asiento',
      price: parseFloat(seat.price || seat.precio || 0),
      zona: seat.zona?.nombre || seat.zona || 'General',
      mesa: seat.mesa?.nombre || seat.mesa || null,
      ...(seat.abonoGroup ? { abonoGroup: seat.abonoGroup } : {})
    };
  });

  // Normalizar campos y agregar valores faltantes
  const { tenantId, ...restData } = data || {};
  const computedTotal = Number(restData.amount) || Number(restData.monto) || calculateTotalAmount(validatedSeats);
  const normalizedTenantId = restData.tenant_id || tenantId || '9dbdb86f-8424-484c-bb76-0d9fa27573c8';

  // Normalizar campo user: debe ser UUID, no objeto
  let normalizedUserId = restData.user_id || restData.userId || restData.usuario_id;
  if (restData.user && typeof restData.user === 'object' && restData.user.id) {
    normalizedUserId = restData.user.id;
  } else if (restData.user && typeof restData.user === 'string') {
    normalizedUserId = restData.user;
  }

  const enrichedData = {
    ...restData,
    seats: validatedSeats, // Usar la versión validada
    tenant_id: normalizedTenantId, // Asegurar snake_case para la columna
    amount: computedTotal, // COLUMN REQUIRED (NOT NULL)
    monto: computedTotal,  // Mantener compatibilidad con código existente
    payment_gateway_id: restData.payment_gateway_id || '7e797aa6-ebbf-4b3a-8b5d-caa8992018f4', // Gateway por defecto (Reservas)
    user: normalizedUserId, // Campo user debe ser UUID, no objeto
    user_id: normalizedUserId, // Asegurar que user_id también esté establecido
    created_at: new Date().toISOString()
  };

  // Eliminar campos duplicados si existen
  if (enrichedData.userId) {
    delete enrichedData.userId;
  }

  logger.log('🔍 Datos enriquecidos para crear pago:', { seatsCount: enrichedData.seats?.length || 0, amount: enrichedData.amount });

  // Normalizar order_id como locator si no viene
  if (!enrichedData.order_id && enrichedData.locator) {
    enrichedData.order_id = enrichedData.locator;
  }

  const { data: result, error } = await client
    .from('payment_transactions')
    .insert(enrichedData)
    .select()
    .single();
  handleError(error);
  logger.log('createPayment response:', { result: result ? 'success' : 'error', error: error?.message });
  return result;
};

// Función auxiliar para calcular el monto total
const calculateTotalAmount = (seatsData) => {
  try {
    const seats = parseSeatsArray(seatsData);
    return seats.reduce((total, seat) => total + (seat.price || 0), 0);
  } catch (e) {
    logger.error('Error calculando monto total:', e);
    return 0;
  }
};

export const updatePayment = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client
    .from('payment_transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return result;
};

export const fetchPayments = async () => {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client.from('payment_transactions').select('*');
  handleError(error);
  return data;
};

// Función para limpiar locks expirados
export const cleanupExpiredLocks = async () => {
  const client = supabaseAdmin || supabase;

  try {
    logger.log('🧹 [cleanupExpiredLocks] Limpiando locks expirados...');

    const { data, error } = await client
      .from('seat_locks')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'locked')
      .select();

    if (error) {
      console.error('❌ [cleanupExpiredLocks] Error limpiando locks:', error);
      return { data: null, error };
    }
    return { data, error: null };

  } catch (error) {
    console.error('❌ [cleanupExpiredLocks] Error general:', error);
    return { data: null, error };
  }
};

// Función para crear un lock de asiento
export const createSeatLock = async (seatId, funcionId, userId = null, expiresInMinutes = 15) => {
  const client = supabaseAdmin || supabase;

  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const lockData = {
      seat_id: seatId,
      funcion_id: funcionId,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      status: 'locked',
      lock_type: 'seat',
      tenant_id: '9dbdb86f-8424-484c-bb76-0d9fa27573c8' // Tenant por defecto
    };

    const { data, error } = await client
      .from('seat_locks')
      .insert(lockData)
      .select()
      .single();

    if (error) {
      console.error('❌ [createSeatLock] Error creando lock:', error);
      return { data: null, error };
    }
    return { data, error: null };

  } catch (error) {
    console.error('❌ [createSeatLock] Error general:', error);
    return { data: null, error };
  }
};

// Función para liberar un lock de asiento
export const releaseSeatLock = async (seatId, funcionId) => {
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('seat_locks')
      .delete()
      .eq('seat_id', seatId)
      .eq('funcion_id', funcionId)
      .eq('status', 'locked')
      .select();

    if (error) {
      console.error('❌ [releaseSeatLock] Error liberando lock:', error);
      return { data: null, error };
    }
    return { data, error: null };

  } catch (error) {
    console.error('❌ [releaseSeatLock] Error general:', error);
    return { data: null, error };
  }
};

export const fetchPaymentByLocator = async (locator) => {
  const client = supabaseAdmin || supabase;
  if (!locator) {
    return { data: null, error: null };
  }

  try {
    const baseSelect = `
      *,
      seats,
      funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
      event:eventos(id, nombre),
      user:profiles!user_id(id, login, telefono)
    `;

    const fallbackSelect = `
      *,
      seats,
      funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
      event:eventos(id, nombre),
      user:profiles!user_id(id, login, telefono)
    `;

    let { data, error } = await client
      .from('payment_transactions')
      .select(baseSelect)
      .eq('locator', locator)
      .maybeSingle();

    if (error && error.code === '42703') {
      const fallbackResult = await client
        .from('payment_transactions')
        .select(fallbackSelect)
        .eq('locator', locator)
        .maybeSingle();

      data = fallbackResult.data
        ? {
          ...fallbackResult.data,
          user: fallbackResult.data.user
            ? { ...fallbackResult.data.user }
            : null
        }
        : null;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('🔍 [fetchPaymentByLocator] Error:', error);
      return { data: null, error };
    }

    if (data) {
      // Procesar los seats para incluir información adicional
      const seats = parseSeatsArray(data.seats);
      const processedPayment = {
        ...data,
        seatsCount: seats.length,
        totalAmount: seats.reduce((sum, seat) => sum + (seat.price || 0), 0),
        seats: seats
      };
      return { data: processedPayment, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('🔍 [fetchPaymentByLocator] Error inesperado:', error);
    return { data: null, error };
  }
};

export const fetchPaymentBySeat = async (funcionId, seatId) => {
  const client = supabaseAdmin || supabase;
  if (!funcionId || !seatId) {
    return null;
  }

  try {
    // Buscar pagos que contengan el asiento específico usando múltiples estrategias
    let query = client
      .from('payment_transactions')
      .select('*, seats, funcion_id, event:eventos(*), user:profiles!user_id(*)')
      .eq('funcion_id', funcionId);

    // Aplicar filtro contains sobre el array de seats asegurando un JSON válido
    const seatFilterValue = JSON.stringify([{ id: seatId }]);

    const { data, error } = await query
      .filter('seats', 'cs', seatFilterValue)
      .or(`seats.cs.[{"_id":"${seatId}"}],seats.cs.[{"id":"${seatId}"}]`);
    if (error) {
      console.error('🔍 [fetchPaymentBySeat] Error:', error);
      // Si hay error con contains, continuar con búsqueda manual
    }

    // Si no se encuentra con contains o hay error, intentar con una búsqueda más amplia
    if (!data || data.length === 0 || error) {
      // Obtener todos los pagos para esta función y buscar manualmente
      const { data: allPayments, error: allError } = await client
        .from('payment_transactions')
        .select('*, seats, funcion_id, event:eventos(*), user:profiles!user_id(*)')
        .eq('funcion_id', funcionId);

      if (allError) {
        console.error('🔍 [fetchPaymentBySeat] Error obteniendo todos los pagos:', allError);
        return null;
      }

      // Buscar manualmente en los seats de cada pago
      for (const payment of allPayments || []) {
        const paymentSeats = parseSeatsArray(payment.seats);
        const foundSeat = paymentSeats.find(seat =>
          seat.id === seatId || seat._id === seatId
        );

        if (foundSeat) {
          return payment;
        }
      }
    }

    // Retornar el primer pago encontrado
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('🔍 [fetchPaymentBySeat] Error inesperado:', error);
    return null;
  }
};

// Nueva función para buscar pagos por email de usuario
export const fetchPaymentsByUserEmail = async (email) => {
  const client = supabaseAdmin || supabase;
  if (!email) {
    return { data: [], error: null };
  }

  try {
    // Primero buscar el usuario por email
    const userResult = await client
      .from('profiles')
      .select('id, login, telefono')
      .eq('login', email)
      .maybeSingle();

    let user = userResult.data;
    let userError = userResult.error;

    if (userError && userError.code === '42703') {
      const fallbackUser = await client
        .from('profiles')
        .select('id, login, telefono')
        .eq('login', email)
        .maybeSingle();

      user = fallbackUser.data
        ? { ...fallbackUser.data }
        : null;
      userError = fallbackUser.error;
    }

    if (userError) {
      console.error('🔍 [fetchPaymentsByUserEmail] Error buscando usuario:', userError);
      return { data: [], error: userError };
    }

    if (!user) {
      return { data: [], error: null };
    }

    // Buscar todos los pagos del usuario
    const paymentsBaseSelect = `
      *,
      seats,
      funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
      event:eventos(id, nombre),
      user:profiles!user_id(id, login, telefono)
    `;

    const paymentsFallbackSelect = `
      *,
      seats,
      funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
      event:eventos(id, nombre),
      user:profiles!user_id(id, login, telefono)
    `;

    let { data: payments, error: paymentsError } = await client
      .from('payment_transactions')
      .select(paymentsBaseSelect)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (paymentsError && paymentsError.code === '42703') {
      const fallbackPayments = await client
        .from('payment_transactions')
        .select(paymentsFallbackSelect)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      payments = (fallbackPayments.data || []).map(payment => ({
        ...payment,
        user: payment.user
          ? { ...payment.user }
          : null
      }));
      paymentsError = fallbackPayments.error;
    }

    if (paymentsError) {
      console.error('🔍 [fetchPaymentsByUserEmail] Error buscando pagos:', paymentsError);
      return { data: [], error: paymentsError };
    }

    const normalizedPayments = Array.isArray(payments)
      ? payments
      : [];

    // Procesar los pagos para incluir información adicional
    const processedPayments = normalizedPayments.map(payment => {
      const seats = parseSeatsArray(payment.seats);
      return {
        ...payment,
        seatsCount: seats.length,
        totalAmount: seats.reduce((sum, seat) => sum + (seat.price || 0), 0),
        seats: seats
      };
    });
    return { data: processedPayments, error: null, user };

  } catch (error) {
    console.error('🔍 [fetchPaymentsByUserEmail] Error inesperado:', error);
    return { data: [], error };
  }
};

// === CANALES DE VENTA ===
export const fetchCanalesVenta = async () => {
  const { data, error } = await supabase.from('canales_venta').select('*');
  handleError(error);
  return data;
};

// Esta función ya no es necesaria ya que las páginas se cargan directamente desde la base de datos
// y se crean automáticamente cuando se crean eventos

// Función para obtener todas las páginas CMS desde la base de datos
export const fetchAllCmsPages = async () => {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('❌ [fetchAllCmsPages] Error:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('❌ [fetchAllCmsPages] Error inesperado:', error);
    return [];
  }
};

// Función para crear una página CMS automáticamente cuando se crea un evento
export const createCmsPageForEvent = async (eventData) => {
  try {
    // Generar slug a partir del nombre del evento
    const slug = eventData.nombre
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones múltiples
      .trim();

    // Verificar si ya existe una página con ese slug
    const { data: existingPage, error: checkError } = await supabase
      .from('cms_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [createCmsPageForEvent] Error verificando slug existente:', checkError);
      return null;
    }

    if (existingPage) {
      return existingPage;
    }

    // Crear la página CMS para el evento
    const { data: newPage, error: insertError } = await supabase
      .from('cms_pages')
      .insert([{
        slug: slug,
        nombre: eventData.nombre,
        widgets: {
          header: [],
          content: [
            {
              type: 'event_header',
              config: {
                title: eventData.nombre,
                description: eventData.descripcion || '',
                image: eventData.imagen || null
              }
            },
            {
              type: 'event_details',
              config: {
                show_date: true,
                show_location: true,
                show_prices: true
              }
            }
          ],
          footer: []
        },
        tenant_id: eventData.tenant_id
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ [createCmsPageForEvent] Error creando página CMS:', insertError);
      return null;
    }
    return newPage;

  } catch (error) {
    console.error('❌ [createCmsPageForEvent] Error inesperado:', error);
    return null;
  }
};

// Función para obtener todas las páginas CMS de un tenant específico
export const fetchCmsPagesByTenant = async (tenantId) => {
  try {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre');

    if (error) {
      console.error('❌ [fetchCmsPagesByTenant] Error:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('❌ [fetchCmsPagesByTenant] Error inesperado:', error);
    return [];
  }
};

// === GALERÍA E IMÁGENES ===
export const fetchGaleria = async () => {
  return fetchByTenant('galeria', {}, { orderBy: 'created_at', ascending: false });
};

export const fetchImagenes = async () => {
  return fetchByTenant('imagenes', {}, { orderBy: 'created_at', ascending: false });
};

export const createGaleriaItem = async (data) => {
  return createRecord('galeria', data);
};

export const createImagen = async (data) => {
  return createRecord('imagenes', data);
};

export const deleteGaleriaItem = async (id) => {
  return deleteRecord('galeria', id);
};

export const deleteImagen = async (id) => {
  return deleteRecord('imagenes', id);
};

// === NOTIFICACIONES ===
export const fetchNotifications = async () => {
  return fetchByTenant('notifications', {}, {
    select: `
      *,
      eventos:evento_id(id, nombre),
      funciones:funcion_id(id, fecha_celebracion)
    `,
    orderBy: 'created_at',
    ascending: false
  });
};

export const fetchNotificationById = async (id) => {
  return fetchById('notifications', id, {
    select: `
      *,
      eventos:evento_id(id, nombre),
      funciones:funcion_id(id, fecha_celebracion)
    `
  });
};

export const createNotification = async (data) => {
  return createRecord('notifications', data);
};

export const updateNotification = async (id, data) => {
  return updateRecord('notifications', id, data);
};

export const deleteNotification = async (id) => {
  return deleteRecord('notifications', id);
};

// Puedes seguir migrando más entidades según este mismo patrón.
