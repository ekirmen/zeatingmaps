import { supabase } from '../../supabaseClient';

// 🔹 Obtener una página CMS por slug
export const getCmsPage = async (slug) => {
  let { data, error } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    const fallback = await supabase
      .from('cms_pages')
      .select('*')
      .eq('nombre', slug)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('Error al obtener CMS page desde Supabase:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener un evento por ID
export const getEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error al obtener evento:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener funciones por evento
export const getFunciones = async (eventId) => {
  const { data, error } = await supabase
    .from('funciones')
    .select('*')
    .eq('evento', eventId);

  if (error) {
    console.error('Error al obtener funciones:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener una función por ID
export const getFuncion = async (funcionId) => {
  const { data, error } = await supabase
    .from('funciones')
    .select('*')
    .eq('id', funcionId)
    .single();

  if (error) {
    console.error('Error al obtener función:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener todas las zonas
export const getZonas = async () => {
  const { data, error } = await supabase
    .from('zonas')
    .select('*');

  if (error) {
    console.error('Error al obtener zonas:', error);
    throw error;
  }

  return data;
};

// Alias usado por otros componentes
export const fetchZonas = () => getZonas();

// 🔹 Obtener pagos por evento
export const getPagosPorEvento = async (eventId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('evento', eventId);

  if (error) {
    console.error('Error al obtener pagos:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener plantilla por ID
export const getPlantilla = async (plantillaId) => {
  const { data, error } = await supabase
    .from('plantillas')
    .select('*')
    .eq('id', plantillaId)
    .single();

  if (error) {
    console.error('Error al obtener plantilla:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener mapa por evento
export const getMapaPorEvento = async (eventId) => {
  const { data, error } = await supabase
    .from('mapas')
    .select('*')
    .eq('evento', eventId)
    .single();

  if (error) {
    console.error('Error al obtener mapa por evento:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener mapa por sala ID (y opcionalmente función)
export const fetchMapa = async (salaId) => {
  try {
    if (!salaId) return null;

    const { data, error } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener el mapa:', error);
    throw error;
  }
};

// 🔹 Obtener descuento por código
export const fetchDescuentoPorCodigo = async (codigo) => {
  const { data, error } = await supabase
    .from('descuentos')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (error) {
    console.error('Código de descuento no válido:', error);
    throw error;
  }

  return data;
};

// 🔹 Obtener plantilla de precios (alias de getPlantilla)
export const fetchPlantillaPrecios = (id) => getPlantilla(id);
