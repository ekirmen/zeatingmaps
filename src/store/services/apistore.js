// src/store/services/apistore.js

// Removed API_BASE_URL as we are now directly using Supabase for these calls
import { supabase } from '../../supabaseClient'; // Assuming you use Supabase for data

// Helper: verifica si una columna existe - versión simplificada sin information_schema
async function hasColumn(tableName, columnName) {
  // Para cms_pages, sabemos que created_at existe según el schema
  if (tableName === 'cms_pages') {
    if (columnName === 'created_at') return true;
    if (columnName === 'updated_at') return false; // No existe en el schema actual
    return false;
  }
  return false;
}



/**
 * Fetches a CMS page by its slug directly from Supabase.
 * This is used by EventsVenue to load the home page widgets.
 *
 * @param {string} slug - The slug of the CMS page (e.g., 'home').
 * @returns {Promise<object>} A promise that resolves to the CMS page data.
 * @throws {Error} If the Supabase query fails.
 */
export const getCmsPage = async (slug) => {
  try {
    console.log('🔍 [getCmsPage] Intentando cargar página:', slug);
    console.log('🔍 [getCmsPage] Usando tabla: cms_pages');
    
    const { data, error } = await supabase
      .from('cms_pages') // Usar la tabla correcta según el schema
      .select('*') // Seleccionar todas las columnas para debug
      .eq('slug', slug) // Filter by the slug
      .single(); // Expect a single result

    console.log('🔍 [getCmsPage] Resultado de la consulta:', { data, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('❌ [getCmsPage] Error fetching CMS page from Supabase:', error.message);
      console.error('❌ [getCmsPage] Error details:', { code: error.code, details: error.details, hint: error.hint });
      throw error;
    }
    
    // Adaptar a la estructura real de cms_pages
    if (data) {
      // Crear un objeto widgets basado en los datos disponibles
      const result = {
        widgets: data.widgets || {
          content: [
            {
              type: 'page_header',
              title: data.nombre || 'Página sin título',
              description: data.descripcion || '',
              meta: {
                title: data.meta_title,
                description: data.meta_description,
                keywords: data.meta_keywords,
                og_image: data.og_image
              }
            }
          ]
        },
        // Incluir datos originales para debug
        original_data: data
      };
      
      console.log('🔍 [getCmsPage] Página encontrada, creando widgets sintéticos:', result);
      return result;
    }
    
    // Si no hay datos, retornar estructura vacía
    const emptyResult = { 
      widgets: { content: [] },
      original_data: null 
    };
    console.log('🔍 [getCmsPage] No se encontró página, retornando estructura vacía:', emptyResult);
    return emptyResult;
  } catch (error) {
    console.error('❌ [getCmsPage] Unexpected error:', error);
    throw error;
  }
};

/**
 * Fetches functions (specific event occurrences) for a given event ID.
 *
 * @param {string|number} eventId - The ID of the event.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of function objects.
 * @throws {Error} If the Supabase query fails.
 */
export const getFunciones = async (eventId) => {
  try {
    console.log('[getFunciones DEBUG] Iniciando búsqueda de funciones para evento:', eventId);
    
    // Primero obtener el evento para obtener su tenant_id
    const { data: eventoData, error: eventoError } = await supabase
      .from('eventos')
      .select('tenant_id')
      .eq('id', eventId)
      .single();

    if (eventoError) {
      console.error('[getFunciones DEBUG] Error fetching evento tenant:', eventoError.message);
      throw eventoError;
    }

    if (!eventoData) {
      console.error('[getFunciones DEBUG] Evento no encontrado');
      return [];
    }

    console.log('[getFunciones DEBUG] Evento encontrado, tenant_id:', eventoData.tenant_id);

    // Construir query base usando columnas nuevas (evento_id/sala_id)
    let { data, error } = await supabase
      .from('funciones')
      .select(`
        id,
        fecha_celebracion,
        evento_id,
        sala_id
      `)
      .eq('evento_id', eventId)
      .eq('tenant_id', eventoData.tenant_id)
      .order('fecha_celebracion', { ascending: true });

    // Si la columna evento_id no existe (esquema antiguo), reintentar con nombres viejos
    if (error && /evento_id/.test(error.message)) {
      ({ data, error } = await supabase
        .from('funciones')
        .select(`id, fecha_celebracion, evento, sala`)
        .eq('evento', eventId)
        .eq('tenant_id', eventoData.tenant_id)
        .order('fecha_celebracion', { ascending: true }));
    }

    if (error) {
      console.error('[getFunciones DEBUG] Error fetching funciones:', error.message);
      throw error;
    }

    console.log('[getFunciones DEBUG] Funciones encontradas:', data?.length || 0, 'funciones');

    // Obtener información de salas por separado para evitar conflictos de relaciones
    const salasIds = [...new Set((data || []).map(f => f.sala_id || f.sala).filter(Boolean))];
    let salasData = {};
    
    if (salasIds.length > 0) {
      const { data: salas, error: salasError } = await supabase
        .from('salas')
        .select('id, nombre')
        .in('id', salasIds);
      
      if (!salasError && salas) {
        salasData = salas.reduce((acc, sala) => {
          acc[sala.id] = sala;
          return acc;
        }, {});
      }
    }

    // Transformar datos al formato esperado por el frontend
    const transformedData = (data || []).map(funcion => {
      const salaId = funcion.sala_id ?? funcion.sala;
      return {
        id: funcion.id,
        fecha_celebracion: funcion.fecha_celebracion,
        evento: funcion.evento_id ?? funcion.evento,
        sala: salaId,
        sala_nombre: salasData[salaId]?.nombre || 'Sala sin nombre',
        // Crear un objeto plantilla básico si no existe
        plantilla: {
          id: null,
          nombre: 'Plantilla Básica',
          detalles: []
        }
      };
    });

    console.log('[getFunciones DEBUG] Datos transformados:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('[getFunciones DEBUG] Unexpected error in getFunciones:', error);
    throw error;
  }
};

/**
 * Fetches a single function (event occurrence) by its ID.
 *
 * @param {string|number} functionId - The ID of the function.
 * @returns {Promise<object|null>} A promise that resolves to a single function object or null if not found.
 * @throws {Error} If the Supabase query fails.
 */
export const getFuncion = async (functionId) => {
  try {
    // Primero obtener la función para obtener su tenant_id
      const { data: funcionData, error: funcionError } = await supabase
        .from('funciones')
        .select('tenant_id, evento_id')
        .eq('id', functionId)
        .single();

    if (funcionError && funcionError.code !== 'PGRST116') {
      console.error('Error fetching funcion tenant:', funcionError.message);
      throw funcionError;
    }

    if (!funcionData) {
      return null;
    }

      // Ahora obtener la función completa filtrando por tenant_id
      let { data, error } = await supabase
        .from('funciones')
        .select(`
          id,
          fecha_celebracion,
          evento_id,
          sala_id,
          salas (
            id,
            nombre
          )
        `)
        .eq('id', functionId)
        .eq('tenant_id', funcionData.tenant_id)
        .single();

      // Fallback para esquemas antiguos
      if (error && /evento_id/.test(error.message)) {
        ({ data, error } = await supabase
          .from('funciones')
          .select(`
            id,
            fecha_celebracion,
            evento,
            sala,
            salas (
              id,
              nombre
            )
          `)
          .eq('id', functionId)
          .eq('tenant_id', funcionData.tenant_id)
          .single());
      }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching single function:', error.message);
      throw error;
    }

    if (!data) return null;

    // Transformar datos al formato esperado por el frontend
      const salaId = data.sala_id ?? data.sala;
      const transformedData = {
        id: data.id,
        fecha_celebracion: data.fecha_celebracion,
        evento: data.evento_id ?? data.evento,
        sala: salaId,
        sala_nombre: data.salas?.nombre || 'Sala sin nombre',
        // Crear un objeto plantilla básico si no existe
        plantilla: {
          id: null,
          nombre: 'Plantilla Básica',
          detalles: []
        }
      };

      return transformedData;
  } catch (error) {
    console.error('Unexpected error in getFuncion:', error);
    throw error;
  }
};


/**
 * Fetches a seating map by its ID.
 *
 * @param {number} mapId - The ID of the seating map.
 * @returns {Promise<object>} A promise that resolves to the map data.
 * @throws {Error} If the Supabase query fails.
 */
export const fetchMapa = async (salaIdOrMapId, by = 'sala') => {
  try {
    console.log(`[fetchMapa] Intentando obtener mapa para ${by === 'id' ? 'map id' : 'sala_id'}:`, salaIdOrMapId);
    
    // Verificar si el cliente Supabase está disponible
    if (!supabase) {
      console.error('[fetchMapa] Error: Cliente Supabase no disponible');
      throw new Error('Cliente Supabase no disponible');
    }

    // Verificar autenticación del usuario
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('[fetchMapa] Error de autenticación:', authError.message);
      throw new Error(`Error de autenticación: ${authError.message}`);
    }

    if (!session) {
      console.warn('[fetchMapa] Usuario no autenticado, intentando acceso anónimo');
      console.log('[fetchMapa] Nota: Las políticas RLS deben permitir acceso anónimo de lectura');
    } else {
      console.log('[fetchMapa] Usuario autenticado:', session.user.id);
    }

    // Construir la consulta con mejor manejo de errores
    let query;
    try {
      query = supabase.from('mapas').select('*');
      console.log('[fetchMapa] Query base construida correctamente');
    } catch (queryError) {
      console.error('[fetchMapa] Error al construir query base:', queryError);
      throw new Error(`Error al construir query: ${queryError.message}`);
    }

    const finalQuery = by === 'id'
      ? query.eq('id', salaIdOrMapId).single()
      : query.eq('sala_id', salaIdOrMapId).single();
    
    console.log('[fetchMapa] Ejecutando query para:', by === 'id' ? 'ID de mapa' : 'ID de sala', salaIdOrMapId);
    console.log('[fetchMapa] Tipo de query:', typeof finalQuery);
    console.log('[fetchMapa] Query object:', finalQuery);
    
    const { data, error, status } = await finalQuery;

    console.log('[fetchMapa] Respuesta de Supabase:', { data, error, status });

    if (error) {
      console.error('[fetchMapa] Error de Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status
      });
      
      // Si es un error 406, puede ser un problema de RLS o permisos
      if (status === 406) {
        console.warn('[fetchMapa] Error 406 - Posibles causas:');
        console.warn('1. Políticas RLS bloqueando el acceso');
        console.warn('2. Usuario no tiene permisos para esta tabla');
        console.warn('3. La tabla no existe o no es accesible');
        console.warn('4. Problema con el tenant_id o filtros de seguridad');
        console.warn('5. Políticas RLS no permiten acceso anónimo');
        
        // Intentar obtener más información sobre el error
        try {
          console.log('[fetchMapa] Probando acceso básico a tabla mapas...');
          const { error: testError } = await supabase
            .from('mapas')
            .select('count')
            .limit(1);
          
          if (testError) {
            console.error('[fetchMapa] Error al verificar acceso a tabla mapas:', testError);
            console.error('[fetchMapa] Código de error:', testError.code);
            console.error('[fetchMapa] Mensaje:', testError.message);
          } else {
            console.log('[fetchMapa] Acceso básico a tabla mapas OK');
          }
        } catch (testErr) {
          console.error('[fetchMapa] Error en prueba de acceso:', testErr);
        }
        
        // Intentar con una consulta más simple
        try {
          console.log('[fetchMapa] Probando consulta simple sin filtros...');
          const { data: simpleData, error: simpleError } = await supabase
            .from('mapas')
            .select('id, sala_id')
            .limit(1);
          
          if (simpleError) {
            console.error('[fetchMapa] Error en consulta simple:', simpleError);
          } else {
            console.log('[fetchMapa] Consulta simple exitosa, datos:', simpleData);
          }
        } catch (simpleErr) {
          console.error('[fetchMapa] Error en consulta simple:', simpleErr);
        }
        
        return null;
      }
      
      // Para otros errores, verificar si es "no encontrado" o un error real
      if (error.code === 'PGRST116') {
        console.log('[fetchMapa] No se encontró mapa (PGRST116)');
        return null;
      }
      
      throw error;
    }

    if (!data) {
      console.log('[fetchMapa] No se encontraron datos');
      return null;
    }

    console.log('[fetchMapa] Mapa encontrado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('[fetchMapa] Error inesperado:', error);
    throw error;
  }
};

// Helper explícito por id de mapa
export const fetchMapaById = async (mapaId) => fetchMapa(mapaId, 'id');

/**
 * Fetches a seating map associated with an event.
 * This might be a fallback if a map is not directly linked to a sala.
 *
 * @param {string|number} eventId - The ID of the event.
 * @returns {Promise<object>} A promise that resolves to the map data.
 * @throws {Error} If the Supabase query fails.
 */
export const getMapaPorEvento = async (eventId) => {
  try {
    // Fetch the map by joining mapas with salas and eventos via sala_id
    // First, fetch the sala_id for the given eventId from funciones table
    const { data: funciones, error: funcError } = await supabase
      .from('funciones')
      .select('sala')
      .eq('evento', eventId)
      .limit(1)
      .single();

    if (funcError) {
      console.error('Error fetching sala for event:', funcError.message);
      return null;
    }
    if (!funciones || !funciones.sala) {
      console.error('No sala found for event:', eventId);
      return null;
    }

    const salaId = funciones.sala;

    // Now fetch the map for the sala_id
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .single();

    if (mapaError) {
      console.error('Error fetching map for sala:', mapaError.message);
      return null;
    }

    return mapa;
  } catch (error) {
    console.error('Unexpected error in getMapaPorEvento:', error);
    throw error;
  }
};

/**
 * Fetches a price template by its ID.
 *
 * @param {number} plantillaId - The ID of the price template.
 * @returns {Promise<object>} A promise that resolves to the price template data.
 * @throws {Error} If the Supabase query fails.
 */
export const fetchPlantillaPrecios = async (plantillaId) => {
  try {
    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .eq('id', plantillaId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('Error fetching price template:', error.message);
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error('Unexpected error in fetchPlantillaPrecios:', error);
    throw error;
  }
};

/**
 * Fetches discount information by a discount code directly from Supabase.
 *
 * @param {string} code - The discount code.
 * @returns {Promise<object|null>} A promise that resolves to the discount data or null if not found.
 * @throws {Error} If the Supabase query fails.
 */
export const fetchDescuentoPorCodigo = async (code) => {
  try {
    const { data, error } = await supabase
      .from('descuentos') // Assuming you have a 'descuentos' table in Supabase
      .select('*')
      .eq('code', code) // Filter by the discount code
      .single(); // Expect a single result

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('Error fetching discount by code from Supabase:', error.message);
      throw error;
    }
    return data; // Will be null if not found
  } catch (error) {
    console.error('Unexpected error in fetchDescuentoPorCodigo:', error);
    throw error;
  }
};

/**
 * Fetches an event by its slug from the "eventos" table in Supabase.
 *
 * @param {string} slug - The slug of the event.
 * @returns {Promise<object|null>} A promise that resolves to the event data or null if not found.
 * @throws {Error} If the Supabase query fails.
 */
export const fetchEventoBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching event by slug:', error.message);
      throw error;
    }
    return data; // Will be null if not found
  } catch (error) {
    console.error('Unexpected error in fetchEventoBySlug:', error);
    throw error;
  }
};

/**
 * Fetches zones (zonas) by sala ID.
 *
 * @param {string|number} salaId - The ID of the sala.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of zone objects.
 * @throws {Error} If the Supabase query fails.
 */
export const fetchZonasBySala = async (salaId) => {
  try {
    const { data, error } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId);

    if (error) {
      console.error('Error fetching zonas by sala:', error.message);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error in fetchZonasBySala:', error);
    throw error;
  }
};

/**
 * Obtiene todas las páginas CMS de un tenant específico
 * Esto permite mostrar las páginas de eventos en el store
 */
export const getAllCmsPages = async () => {
  try {
    console.log('🔍 [getAllCmsPages] Obteniendo todas las páginas CMS...');
    
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('❌ [getAllCmsPages] Error:', error);
      throw error;
    }

    console.log(`✅ [getAllCmsPages] ${data?.length || 0} páginas encontradas`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllCmsPages] Error inesperado:', error);
    return [];
  }
};

/**
 * Obtiene las páginas CMS de eventos (páginas con tenant_id)
 * Estas son las páginas creadas automáticamente cuando se crea un evento
 */
export const getEventCmsPages = async () => {
  try {
    console.log('🔍 [getEventCmsPages] Obteniendo páginas de eventos...');
    
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .not('tenant_id', 'is', null)
      .order('nombre');

    if (error) {
      console.error('❌ [getEventCmsPages] Error:', error);
      throw error;
    }

    console.log(`✅ [getEventCmsPages] ${data?.length || 0} páginas de eventos encontradas`);
    return data || [];
  } catch (error) {
    console.error('❌ [getEventCmsPages] Error inesperado:', error);
    return [];
  }
};
