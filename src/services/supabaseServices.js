import { supabase } from '../supabaseClient';

// ✅ fetchMapa SIN usar relaciones automáticas
export const fetchMapa = async (salaId) => {
  if (!salaId) return null;

  const { data, error } = await supabase
    .from('mapas')
    .select('*') // no necesitas joins
    .eq('sala_id', salaId)
    .maybeSingle();

  if (error) throw error;

  return data; // data.contenido ya contiene el JSON embebido
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
