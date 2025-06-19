import { supabase } from './supabaseClient';

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

export const fetchZonasPorSala = async (salaId) => {
  const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', salaId);
  handleError(error);
  return data;
};

export const createZona = async (data) => {
  const { data: result, error } = await supabase.from('zonas').insert(data).single();
  handleError(error);
  return result;
};

export const updateZona = async (id, data) => {
  const { data: result, error } = await supabase.from('zonas').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteZona = async (id) => {
  const { error } = await supabase.from('zonas').delete().eq('id', id);
  handleError(error);
};

// === SALAS Y RECINTOS ===
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
  const { data: result, error } = await supabase.from('eventos').insert(data).single();
  handleError(error);
  return result;
};

export const updateEvento = async (id, data) => {
  const { data: result, error } = await supabase.from('eventos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteEvento = async (id) => {
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  handleError(error);
};

// === FUNCIONES ===
export const fetchFuncionesPorEvento = async (eventoId) => {
  const { data, error } = await supabase.from('funciones').select('*').eq('evento_id', eventoId);
  handleError(error);
  return data;
};

export const createFuncion = async (data) => {
  const { data: result, error } = await supabase.from('funciones').insert(data).single();
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
  const { data, error } = await supabase.from('mapas').upsert({ sala_id: salaId, contenido }, { onConflict: ['sala_id'] });
  handleError(error);
  return data;
};

// === ENTRADAS ===
export const fetchEntradas = async () => {
  const { data, error } = await supabase.from('entradas').select('*');
  handleError(error);
  return data;
};

export const fetchEntradaById = async (id) => {
  const { data, error } = await supabase.from('entradas').select('*').eq('id', id).single();
  handleError(error);
  return data;
};

export const createEntrada = async (data) => {
  const { data: result, error } = await supabase.from('entradas').insert(data).single();
  handleError(error);
  return result;
};

export const updateEntrada = async (id, data) => {
  const { data: result, error } = await supabase.from('entradas').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteEntrada = async (id) => {
  const { error } = await supabase.from('entradas').delete().eq('id', id);
  handleError(error);
};

// === CMS ===
export const fetchCmsPage = async (pageId) => {
  const { data, error } = await supabase.from('cms_pages').select('*').eq('id', pageId).single();
  handleError(error);
  return data;
};

export const saveCmsPage = async (pageId, widgets) => {
  const { data, error } = await supabase.from('cms_pages').upsert({ id: pageId, widgets });
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

export const fetchPlantillasPorRecintoYSala = async (recintoId, salaId) => {
  const { data, error } = await supabase
    .from('plantillas')
    .select('*')
    .eq('recinto_id', recintoId)
    .eq('sala_id', salaId);

  if (error) {
    console.error('Error al obtener plantillas:', error);
    throw new Error('No se pudieron cargar las plantillas');
  }

  return data;
};
// Puedes seguir migrando más entidades según este mismo patrón.
