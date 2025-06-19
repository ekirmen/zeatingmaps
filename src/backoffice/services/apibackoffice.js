import { supabase } from '../../lib/supabaseClient';

// Helper para manejar errores
const handleError = (error) => {
  if (error) {
    console.error('Supabase error:', error.message);
    throw new Error(error.message);
  }
};

// === ZONAS ===
export const fetchZonas = async () => {
  const { data, error } = await supabase.from('zonas').select('*');
  handleError(error);
  return data;
};

export const fetchEventos = async () => {
  const { data, error } = await supabase.from('eventos').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchZonasPorSala = async (salaId) => {
  const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', salaId);
  handleError(error);
  return data;
};

export const createZona = async (zonaData) => {
  const { data, error } = await supabase.from('zonas').insert(zonaData).single();
  handleError(error);
  return data;
};

export const updateZona = async (id, zonaData) => {
  const { data, error } = await supabase.from('zonas').update(zonaData).eq('id', id).single();
  handleError(error);
  return data;
};

export const deleteZona = async (id) => {
  const { error } = await supabase.from('zonas').delete().eq('id', id);
  handleError(error);
};

// === RECINTOS Y SALAS ===
export const fetchRecintos = async () => {
  const { data, error } = await supabase.from('recintos').select('*, salas(*)');
  handleError(error);
  return data;
};

export const createRecinto = async (data) => {
  const { data: result, error } = await supabase.from('recintos').insert(data).single();
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

export const createSala = async (data) => {
  const { data: result, error } = await supabase.from('salas').insert(data).single();
  handleError(error);
  return result;
};

// === MAPAS ===
export const fetchMapa = async (salaId) => {
  const { data, error } = await supabase.from('mapas').select('*').eq('sala_id', salaId).single();
  handleError(error);
  return data;
};

export const saveMapa = async (salaId, contenido) => {
  const { data, error } = await supabase
    .from('mapas')
    .upsert({ sala_id: salaId, contenido }, { onConflict: ['sala_id'] });
  handleError(error);
  return data;
};

// === ABONOS ===
export const fetchAbonosByUser = async (userId) => {
  const { data, error } = await supabase.from('abonos').select('*').eq('user_id', userId);
  handleError(error);
  return data;
};

export const createAbono = async (data) => {
  const { data: result, error } = await supabase.from('abonos').insert(data).single();
  handleError(error);
  return result;
};

export const renewAbono = async (id, data) => {
  const { data: result, error } = await supabase.from('abonos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

// Puedes seguir este patrón para eventos, funciones, entradas, usuarios, etc.

