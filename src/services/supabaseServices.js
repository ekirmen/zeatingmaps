import { supabase } from '../supabaseClient';

// ✅ fetchMapa SIN usar relaciones automáticas
export const fetchMapa = async (salaId) => {
  if (!salaId) {
    console.log('❌ [fetchMapa] No se proporcionó salaId');
    return null;
  }

  console.log('🔍 [fetchMapa] Buscando mapa para sala:', salaId);

  try {
    const { data, error } = await supabase
      .from('mapas')
      .select('*') // no necesitas joins
      .eq('sala_id', salaId)
      .maybeSingle();

    if (error) {
      console.error('❌ [fetchMapa] Error al buscar mapa:', error);
      throw error;
    }

    if (!data) {
      console.warn('⚠️ [fetchMapa] No se encontró mapa para la sala:', salaId);
      return null;
    }

    console.log('✅ [fetchMapa] Mapa encontrado:', {
      id: data.id,
      sala_id: data.sala_id,
      nombre: data.nombre,
      contenido: data.contenido,
      tenant_id: data.tenant_id,
      contenido_tipo: typeof data.contenido,
      contenido_longitud: Array.isArray(data.contenido) ? data.contenido.length : 'N/A'
    });

    return data; // data.contenido ya contiene el JSON embebido
  } catch (error) {
    console.error('❌ [fetchMapa] Error inesperado:', error);
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
