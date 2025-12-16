import { supabase } from '../supabaseClient';

// Use a fallback logger if no global logger is provided (prevents build eslint no-undef)
const logger = (typeof window !== 'undefined' && window.logger)
  ? window.logger
  : (typeof global !== 'undefined' && global.logger)
    ? global.logger
    : console;

// ✅ fetchMapa SIN usar relaciones automáticas
export const fetchMapa = async (salaId) => {
  if (!salaId) {
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

export const fetchAsientosOcupados = async (funcionId) => {
  // TODO: Implement query logic
  const { data, error } = await supabase
    .from('asientos_ocupados') // Assuming table name
    .select('*')
    .eq('funcion_id', funcionId);

  if (error) throw error;
  return data;
};

export const fetchAsientosReservados = async (funcionId) => {
  // TODO: Implement query logic
  const { data, error } = await supabase
    .from('seat_locks')
    .select('seat_id')
    .eq('funcion_id', funcionId);

  if (error) throw error;
  return data.map(a => a.seat_id);
};

export const fetchBloqueos = async (salaId) => {
  // TODO: Implement query logic
  const { data, error } = await supabase
    .from('bloqueos')
    .select('*')
    .eq('sala_id', salaId);

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

export const fetchUserAbonos = async (userId) => {
  // TODO: Implement query logic
  const { data, error } = await supabase
    .from('abonos')
    .select('*, users:usuario_id(*)')
    .eq('usuario_id', userId);

  if (error) throw error;
  return data.map(a => ({ ...a, user: a.users }));
};
