// src/store/services/apistore.js

// Removed API_BASE_URL as we are now directly using Supabase for these calls
import { supabase } from '../../supabaseClient'; // Assuming you use Supabase for data

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
    const { data, error } = await supabase
      .from('cms_pages') // Assuming you have a 'cms_pages' table in Supabase
      .select('widgets') // Select only the 'widgets' column
      .eq('slug', slug) // Filter by the slug
      .single(); // Expect a single result

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('Error fetching CMS page from Supabase:', error.message);
      throw error;
    }
    // Supabase returns null if single() finds no row, so return an empty widgets object as fallback
    return data || { widgets: { content: [] } };
  } catch (error) {
    console.error('Unexpected error in getCmsPage:', error);
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
    const { data, error } = await supabase
      .from('funciones')
      .select(`
        id,
        fecha_celebracion,
        plantilla:plantilla (id, nombre, detalles),
        sala:salas (id, nombre),
        evento
      `)
      .eq('evento', eventId)
      .order('fecha_celebracion', { ascending: true });

    if (error) {
      console.error('Error fetching funciones:', error.message);
      throw error;
    }

    // Parse detalles JSON string to array if needed
    if (data && Array.isArray(data)) {
      data.forEach(funcion => {
        if (funcion.plantilla && typeof funcion.plantilla.detalles === 'string') {
          try {
            funcion.plantilla.detalles = JSON.parse(funcion.plantilla.detalles);
          } catch (e) {
            console.error('Error parsing plantilla.detalles JSON:', e);
            funcion.plantilla.detalles = [];
          }
        }
      });
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getFunciones:', error);
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
    const { data, error } = await supabase
      .from('funciones')
      .select(`
        id,
        fecha_celebracion,
        plantilla:plantilla (id, nombre, detalles),
        sala:salas (id, nombre),
        evento
      `)
      .eq('id', functionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching single function:', error.message);
      throw error;
    }

    // ✅ Asegurarse de que detalles sea un array
    if (data?.plantilla && typeof data.plantilla.detalles === 'string') {
      try {
        data.plantilla.detalles = JSON.parse(data.plantilla.detalles);
      } catch (e) {
        console.error('Error parsing plantilla.detalles JSON:', e);
        data.plantilla.detalles = [];
      }
    }

    return data;
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
export const fetchMapa = async (salaId) => {
  try {
    const { data, error, status } = await supabase
      .from('mapas')
      .select('contenido')
      .eq('sala_id', salaId)
      .single();

    if (error && status !== 406 && error.code !== 'PGRST116') {
      console.error('Error fetching map:', error.message);
      throw error;
    }

    if (status === 406) {
      console.warn('No map found for sala_id:', salaId);
      return null;
    }

    return data?.contenido || null;
  } catch (error) {
    console.error('Unexpected error in fetchMapa:', error);
    throw error;
  }
};

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
