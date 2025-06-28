import { supabase, supabaseAdmin } from '../../backoffice/services/supabaseClient';

// Map human readable page identifiers to numeric ids stored in Supabase.
// The cms_pages table uses an integer primary key, but within the
// application we refer to pages by a slug such as "home" or "events".
// This helper allows the UI to keep using slugs while converting them
// to the numeric ids expected by Supabase.
const CMS_PAGE_IDS = {
  home: 1,
  events: 2
};

const resolveCmsId = (pageId) => CMS_PAGE_IDS[pageId] || pageId;

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
  const { data, error } = await supabase.from('funciones').select('*').eq('evento', eventoId);
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
  if (!salaId) return null;

  const { data, error } = await supabase
    .from('mapas')
    .select('*')
    .eq('sala_id', salaId)
    .maybeSingle();
  handleError(error);
  return data;
};

export const saveMapa = async (salaId, data) => {
  const { error } = await supabase
    .from('mapas')
    .upsert(
      {
        sala_id: salaId,
        contenido: data.contenido || [],
      },
      {
        onConflict: 'sala_id',
      }
    );

  if (error) {
    console.error('❌ Supabase error:', error);
    throw new Error(error.message);
  }
};

// After saving the base map we may need to replicate the seat
// layout to every function associated with the same sala. This
// helper ensures each function has the seats defined in the map so
// tickets can be sold independently per function.
export const syncSeatsForSala = async (salaId) => {
  const mapa = await fetchMapa(salaId);
  if (!mapa || !Array.isArray(mapa.contenido)) return;

  const { data: funciones, error: funcError } = await supabase
    .from('funciones')
    .select('id')
    .eq('sala', salaId);
  handleError(funcError);
  if (!funciones || funciones.length === 0) return;

  const seatDefs = [];
  mapa.contenido.forEach(el => {
    if (el.type === 'mesa') {
      (el.sillas || []).forEach(s => {
        seatDefs.push({ id: s._id, zona: s.zona || null });
      });
    } else if (el.type === 'silla') {
      seatDefs.push({ id: el._id, zona: el.zona || null });
    }
  });

  for (const func of funciones) {
    const { data: existing, error: exErr } = await supabase
      .from('seats')
      .select('_id')
      .eq('funcion_id', func.id);
    handleError(exErr);
    const existingIds = new Set((existing || []).map(s => s._id));
    const newSeats = seatDefs
      .filter(s => !existingIds.has(s.id))
      .map(s => ({
        _id: s.id,
        funcion_id: func.id,
        zona: s.zona,
        status: 'disponible',
        bloqueado: false,
      }));
    if (newSeats.length > 0) {
      const { error: insertErr } = await supabase.from('seats').insert(newSeats);
      handleError(insertErr);
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


// Obtener página CMS por slug
export const fetchCmsPage = async (slug) => {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data;
};

// Guardar widgets en una página CMS por slug
export const saveCmsPage = async (slug, widgets) => {
  const { error } = await supabase
    .from('cms_pages')
    .update({ widgets })
    .eq('slug', slug);

  if (error) {
    console.error('Error al guardar página CMS:', error);
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

// === PAYMENTS ===
export const createPayment = async (data) => {
  console.log('createPayment request:', data);
  const { data: result, error } = await supabase
    .from('payments')
    .insert(data)
    .select()
    .single();
  handleError(error);
  console.log('createPayment response:', { result, error });
  return result;
};

export const updatePayment = async (id, data) => {
  const { data: result, error } = await supabase
    .from('payments')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return result;
};

export const fetchPayments = async () => {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client.from('payments').select('*');
  handleError(error);
  return data;
};

export const fetchPaymentByLocator = async (locator) => {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('payments')
    .select('*, seats, funcion')
    .eq('locator', locator)
    .single();
  handleError(error);
  return data;
};
// Puedes seguir migrando más entidades según este mismo patrón.
