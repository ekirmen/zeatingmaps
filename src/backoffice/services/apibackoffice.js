import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from '../../supabaseClient';
import { v5 as uuidv5 } from 'uuid';

const CMS_PAGE_IDS = {
  home: 1,
  events: 2
};



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
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('zonas').insert(data).single();
  handleError(error);
  return result;
};

export const updateZona = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('zonas').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteZona = async (id) => {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('zonas').delete().eq('id', id);
  handleError(error);
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
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('eventos').insert(data).single();
  handleError(error);
  return result;
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
    .select('id, fecha_celebracion, inicio_venta, fin_venta, sala, evento')
    .eq('evento', eventoId);
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
export const fetchMapa = async (salaId) => {
  if (!salaId) return null;

  try {
    // Cargar el mapa
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();
    
    if (mapaError) throw mapaError;
    
    // Cargar las zonas de la sala
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId);
    
    if (zonasError) {
      console.warn('Error al cargar zonas, continuando sin zonas:', zonasError);
    }
    
    // Retornar mapa con zonas incluidas
    return {
      ...mapa,
      zonas: zonas || []
    };
  } catch (error) {
    console.error('Error en fetchMapa:', error);
    throw error;
  }
};

export const saveMapa = async (salaId, data) => {
  if (!supabaseAdmin) {
    const resp = await fetch(`/api/mapas/${salaId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: data.contenido || [] })
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
    .upsert({ sala_id: salaId, contenido: data.contenido || [] }, { onConflict: 'sala_id' });
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
  mapa.contenido.forEach(el => {
    if (el.type === 'mesa') {
      (el.sillas || []).forEach(s => { if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || null }); });
    } else if (el.type === 'silla') {
      if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || null });
    }
  });

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
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('entradas').insert(data).single();
  handleError(error);
  return result;
};

export const updateEntrada = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('entradas').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteEntrada = async (id) => {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('entradas').delete().eq('id', id);
  handleError(error);
};

// Obtener página CMS por slug
export const fetchCmsPage = async (slug) => {
  try {
    // Primero intentar buscar por slug
    let { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .ilike('slug', slug)
      .maybeSingle();

    // Si no se encuentra por slug, buscar por nombre
    if (!data && !error) {
      const fallback = await supabase
        .from('cms_pages')
        .select('*')
        .ilike('nombre', slug)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    // Si aún no se encuentra, crear una página por defecto
    if (!data && !error) {
      console.log('Página no encontrada, creando página por defecto');
      const defaultPage = {
        id: slug,
        nombre: slug,
        slug: slug,
        widgets: {
          header: [],
          content: [],
          footer: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Intentar insertar la página por defecto
      const { data: newPage, error: insertError } = await supabase
        .from('cms_pages')
        .insert([defaultPage])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating default page:', insertError);
        // Si no se puede insertar, devolver la página por defecto sin guardar
        return defaultPage;
      }
      
      return newPage;
    }

    if (error) {
      console.error('Supabase error:', error);
      // Devolver página por defecto en caso de error
      return {
        id: slug,
        nombre: slug,
        slug: slug,
        widgets: {
          header: [],
          content: [],
          footer: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return data;
  } catch (error) {
    console.error('Error in fetchCmsPage:', error);
    // Devolver página por defecto en caso de error
    return {
      id: slug,
      nombre: slug,
      slug: slug,
      widgets: {
        header: [],
        content: [],
        footer: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

// Guardar widgets en una página CMS por slug
export const saveCmsPage = async (slug, widgets) => {
  try {
    // Primero verificar si la página existe
    let { data: existingPage, error: checkError } = await supabase
      .from('cms_pages')
      .select('id')
      .ilike('slug', slug)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking page existence:', checkError);
      throw new Error('Error al verificar la página');
    }

    let result;
    
    if (existingPage) {
      // Actualizar página existente
      result = await supabase
        .from('cms_pages')
        .update({ 
          widgets,
          updated_at: new Date().toISOString()
        })
        .ilike('slug', slug);
    } else {
      // Crear nueva página
      result = await supabase
        .from('cms_pages')
        .insert([{
          slug: slug,
          nombre: slug,
          widgets: widgets,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
    }

    if (result.error) {
      console.error('Error al guardar página CMS:', result.error);
      throw new Error('Error al guardar la página');
    }

    return result.data;
  } catch (error) {
    console.error('Error in saveCmsPage:', error);
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
    console.error('Error al obtener plantillas:', error);
    throw new Error('No se pudieron cargar las plantillas');
  }

  return data;
};

// === PAYMENTS ===
export const createPayment = async (data) => {
  const client = supabaseAdmin || supabase;
  console.log('createPayment request:', data);
  const { data: result, error } = await client
    .from('payments')
    .insert(data)
    .select()
    .single();
  handleError(error);
  console.log('createPayment response:', { result, error });
  return result;
};

export const updatePayment = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client
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

export const fetchPaymentBySeat = async (funcionId, seatId) => {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('payments')
    .select('*, seats, funcion, event:eventos(*), user:profiles!usuario_id(*)')
    .eq('funcion', funcionId)
    .contains('seats', [{ id: seatId }])
    .single();
  handleError(error);
  return data;
};
// Puedes seguir migrando más entidades según este mismo patrón.
