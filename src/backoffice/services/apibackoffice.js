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
  // Obtener tenant_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener tenant_id del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile?.tenant_id) {
    throw new Error('Usuario sin tenant_id válido');
  }

  // Filtrar zonas por tenant_id del usuario
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('tenant_id', profile.tenant_id);
  
  handleError(error);
  return data;
};

export const fetchZonasPorSala = async (salaId) => {
  // Obtener tenant_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener tenant_id del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile?.tenant_id) {
    throw new Error('Usuario sin tenant_id válido');
  }

  // Filtrar zonas por sala_id y tenant_id del usuario
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('sala_id', salaId)
    .eq('tenant_id', profile.tenant_id);
  
  handleError(error);
  return data;
};

export const createZona = async (data) => {
  const client = supabaseAdmin || supabase;
  
  // Si no se proporciona tenant_id, obtenerlo de la sala
  if (!data.tenant_id && data.sala_id) {
    try {
      // Obtener el tenant_id de la sala
      const { data: salaData, error: salaError } = await client
        .from('salas')
        .select('recintos!inner(tenant_id)')
        .eq('id', data.sala_id)
        .single();
      
      if (salaError) {
        console.error('[createZona] Error al obtener tenant_id de la sala:', salaError);
      } else if (salaData?.recintos?.tenant_id) {
        data.tenant_id = salaData.recintos.tenant_id;
        console.log('[createZona] Tenant_id asignado automáticamente:', data.tenant_id);
      } else {
        console.warn('[createZona] No se pudo obtener tenant_id de la sala');
      }
    } catch (error) {
      console.error('[createZona] Error al procesar tenant_id:', error);
    }
  }
  
  // Crear la zona con tenant_id
  const { data: result, error } = await client.from('zonas').insert(data).single();
  handleError(error);
  return result;
};

export const updateZona = async (id, data) => {
  const client = supabaseAdmin || supabase;
  
  // Si no se proporciona tenant_id, obtenerlo de la zona existente o de la sala
  if (!data.tenant_id) {
    try {
      // Primero intentar obtener el tenant_id de la zona existente
      const { data: zonaExistente, error: zonaError } = await client
        .from('zonas')
        .select('tenant_id, sala_id')
        .eq('id', id)
        .single();
      
      if (zonaError) {
        console.error('[updateZona] Error al obtener zona existente:', zonaError);
      } else if (zonaExistente?.tenant_id) {
        data.tenant_id = zonaExistente.tenant_id;
        console.log('[updateZona] Tenant_id obtenido de zona existente:', data.tenant_id);
      } else if (zonaExistente?.sala_id) {
        // Si la zona no tiene tenant_id, obtenerlo de la sala
        const { data: salaData, error: salaError } = await client
          .from('salas')
          .select('recintos!inner(tenant_id)')
          .eq('id', zonaExistente.sala_id)
          .single();
        
        if (salaError) {
          console.error('[updateZona] Error al obtener tenant_id de la sala:', salaError);
        } else if (salaData?.recintos?.tenant_id) {
          data.tenant_id = salaData.recintos.tenant_id;
          console.log('[updateZona] Tenant_id asignado automáticamente:', data.tenant_id);
        }
      }
    } catch (error) {
      console.error('[updateZona] Error al procesar tenant_id:', error);
    }
  }
  
  // Actualizar la zona con tenant_id
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
      body: JSON.stringify({ 
        contenido: data.contenido || [],
        tenant_id: data.tenant_id 
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
      tenant_id: data.tenant_id 
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
  mapa.contenido.forEach(el => {
    if (el.type === 'mesa') {
      (el.sillas || []).forEach(s => { if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || 'general' }); });
    } else if (el.type === 'silla') {
      if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || 'general' });
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
  
  // Validar que los asientos no estén ya vendidos
  let seats = data.seats;
  
  // Si seats es string, parsearlo; si ya es objeto, usarlo directamente
  if (typeof seats === 'string') {
    try {
      seats = JSON.parse(seats);
    } catch (e) {
      console.error('Error parsing seats JSON:', e);
      seats = [];
    }
  }
  
  if (seats && Array.isArray(seats)) {
    const funcionId = data.funcion;
    
    console.log('🔍 Validando asientos antes de crear pago:', { seats, funcionId });
    
    for (const seat of seats) {
      const existingPayment = await fetchPaymentBySeat(funcionId, seat.id);
      if (existingPayment && existingPayment.status === 'pagado') {
        throw new Error(`El asiento ${seat.id} ya está vendido (locator: ${existingPayment.locator})`);
      }
    }
  }
  
  // Agregar campos faltantes
  const enrichedData = {
    ...data,
    tenant_id: data.tenant_id || '9dbdb86f-8424-484c-bb76-0d9fa27573c8', // Tenant por defecto
    monto: data.monto || calculateTotalAmount(data.seats), // Calcular monto si no está presente
    metodo_pago_id: data.metodo_pago_id || 1, // Método por defecto
    created_at: new Date().toISOString()
  };
  
  console.log('🔍 Datos enriquecidos para crear pago:', enrichedData);
  
  const { data: result, error } = await client
    .from('payments')
    .insert(enrichedData)
    .select()
    .single();
  handleError(error);
  console.log('createPayment response:', { result, error });
  return result;
};

// Función auxiliar para calcular el monto total
const calculateTotalAmount = (seatsData) => {
  try {
    let seats = seatsData;
    
    // Si seats es string, parsearlo; si ya es objeto, usarlo directamente
    if (typeof seats === 'string') {
      seats = JSON.parse(seats);
    }
    
    if (Array.isArray(seats)) {
      return seats.reduce((total, seat) => total + (seat.price || 0), 0);
    }
    
    return 0;
  } catch (e) {
    console.error('Error calculando monto total:', e);
    return 0;
  }
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

// === CANALES DE VENTA ===
export const fetchCanalesVenta = async () => {
  const { data, error } = await supabase.from('canales_venta').select('*');
  handleError(error);
  return data;
};

// Puedes seguir migrando más entidades según este mismo patrón.
