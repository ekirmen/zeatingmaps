import { supabase } from '../backoffice/services/supabaseClient';

export const fetchMapa = async (salaId) => {
  // El esquema actual ya no cuenta con mapas por función, por lo que
  // simplemente obtenemos el mapa asociado a la sala.
  const { data, error } = await supabase
    .from('mapas')
    .select('*')
    .eq('sala_id', salaId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

  return data;
};

export const fetchZonasPorSala = async (salaId) => {
  const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', salaId);
  if (error) throw error;
  return data;
};

export const fetchAbonoAvailableSeats = async (eventId) => {
  const { data, error } = await supabase
    .from('abonos')
    .select('seat')
    .eq('package_type', 'evento')
    .eq('event_id', eventId)
    .eq('status', 'activo');
  if (error) throw error;
  return data.map(a => a.seat);
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
    .eq('id', funcionId); // ajusta según tu esquema
  if (error) throw error;
  return data?.[0] ?? null;
};

export const fetchAffiliates = async () => {
  const { data, error } = await supabase.from('affiliateusers').select('*, users:profiles(login)');
  if (error) throw error;
  return data.map(a => ({ ...a, user: a.users }));
};
