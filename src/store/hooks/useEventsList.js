// src/hooks/useEventsList.js (or similar path)

import { useState, useEffect, useCallback } from 'react'; // Corrected import syntax
import { getSupabaseClient } from '../../config/supabase'; // Use the centralized config
// Removed unused imports: isUuid and isNumericId

// Helper to normalize event data if needed, similar to what you have
const normalizeEventData = (event) => {
  if (!event) return null;

  let displayImageUrl = `https://placehold.co/80x80/E0F2F7/000?text=${event.nombre ? event.nombre.charAt(0) : 'E'}`;
  if (event.imagenes) {
    try {
      const imageUrls = JSON.parse(event.imagenes);
      // Prioritize obraImagen, then portada, then banner, etc.
      displayImageUrl = imageUrls.obraImagen || imageUrls.portada || imageUrls.banner || displayImageUrl;
    } catch (e) {
      console.error('Error parsing event images JSON:', e);
    }
  }

  // You'll need to fetch recinto name separately if you want 'venue'
  // For now, it will be undefined unless you join it upstream.
  // Example: You might pass recintoInfo from a context or fetch it here
  // For simplicity, we'll leave venue as null/undefined unless joined.

  return {
    id: event.id,
    name: event.nombre,
    date: event.fecha_evento,
    venue: event.recinto, // This will be the ID, you might want the name
    imageUrl: displayImageUrl,
    // Include other relevant properties from your 'eventos' table
    slug: event.slug,
    // ... any other properties you need
  };
};

export const useEventsList = () => {
  console.log('🚀 [useEventsList] Hook iniciando...');
  console.log('🔍 [useEventsList] React hooks disponibles:', { useState: !!useState, useEffect: !!useEffect, useCallback: !!useCallback });
  console.log('🔍 [useEventsList] Hook definido y ejecutándose correctamente');
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('🔍 [useEventsList] Estado inicial:', { events, loading, error });
  console.log('🔍 [useEventsList] Hook useState ejecutado correctamente');

  const fetchAllEvents = useCallback(async () => {
    console.log('🔍 [useEventsList] fetchAllEvents callback creado');
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useEventsList] Iniciando fetch de eventos...');
      
      // Fetch all active events - Consulta simplificada para debuggear
      console.log('🔍 [useEventsList] Ejecutando consulta simple...');
      
      const supabase = getSupabaseClient();
      console.log('🔍 [useEventsList] Cliente Supabase obtenido:', !!supabase);
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }
      
      const { data, error: supabaseError } = await supabase
        .from('eventos')
        .select(`
          id,
          nombre,
          fecha_evento,
          recinto,
          recinto_id,
          activo,
          oculto,
          tenant_id,
          slug,
          tags,
          imagenes,
          descripcion,
          "estadoVenta",
          "modoVenta",
          created_at
        `)
        .eq('activo', true) // Only fetch active events
        .eq('oculto', false); // Only fetch events that are not hidden

      console.log('🔍 [useEventsList] Query ejecutada, resultado:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('🔍 [useEventsList] Error de Supabase:', supabaseError);
        throw supabaseError;
      }

      let rows = data || [];
      console.log('🔍 [useEventsList] Eventos encontrados (primer intento):', rows.length);

      // Fallback: si no hay eventos, reintentar sin el filtro 'oculto=false'
      if (!rows.length) {
        console.warn('🔍 [useEventsList] No se encontraron eventos con oculto=false. Reintentando con activo=true...');
        const { data: dataFallback, error: errFallback } = await supabase
          .from('eventos')
          .select(`
            id,
            nombre,
            fecha_evento,
            recinto,
            recinto_id,
            activo,
            oculto,
            tenant_id,
            slug,
            tags,
            imagenes,
            descripcion,
            "estadoVenta",
            "modoVenta",
            created_at
          `)
          .eq('activo', true);
        
        console.log('🔍 [useEventsList] Fallback query resultado:', { dataFallback, error: errFallback });
        
        if (!errFallback && Array.isArray(dataFallback)) {
          rows = dataFallback;
          console.log('🔍 [useEventsList] Eventos encontrados (fallback):', rows.length);
        }
      }

      // Obtener información de recintos por separado
      const recintoIds = [...new Set([
        ...(rows || []).map(e => e.recinto).filter(Boolean),
        ...(rows || []).map(e => e.recinto_id).filter(Boolean)
      ])];
      
      let recintosData = {};
      if (recintoIds.length > 0) {
        console.log('🔍 [useEventsList] Obteniendo información de recintos:', recintoIds);
        const { data: recintos, error: recintosError } = await supabase
          .from('recintos')
          .select('id, nombre, direccion, ciudad, pais')
          .in('id', recintoIds);
        
        if (!recintosError && recintos) {
          recintosData = recintos.reduce((acc, recinto) => {
            acc[recinto.id] = recinto;
            return acc;
          }, {});
          console.log('🔍 [useEventsList] Recintos obtenidos:', recintosData);
        } else {
          console.error('🔍 [useEventsList] Error obteniendo recintos:', recintosError);
        }
      }

      // Map raw Supabase data to the format expected by EventListWidget
      const formattedEvents = rows.map(event => {
        const recintoId = event.recinto || event.recinto_id;
        const recintoInfo = recintosData[recintoId];
        
        return {
          ...normalizeEventData(event),
          venue: recintoInfo ? recintoInfo.nombre : null, // Get venue name from separate query
          venueInfo: recintoInfo || null, // Include full venue info
          estadoVenta: event.estadoVenta || 'disponible', // Include sale status
          descripcion: event.descripcion || '',
          tags: event.tags || []
        };
      });

      console.log('🔍 [useEventsList] Eventos formateados:', formattedEvents);
      console.log('🔍 [useEventsList] Total de eventos:', formattedEvents.length);

      setEvents(formattedEvents);
    } catch (err) {
      console.error('🔍 [useEventsList] Error fetching events list:', err.message);
      console.error('🔍 [useEventsList] Error completo:', err);
      setError(err);
    } finally {
      setLoading(false);
      console.log('🔍 [useEventsList] Loading terminado');
    }
  }, []);

  useEffect(() => {
    console.log('🔍 [useEventsList] useEffect ejecutado, llamando fetchAllEvents...');
    console.log('🔍 [useEventsList] fetchAllEvents función:', typeof fetchAllEvents);
    fetchAllEvents();
  }, [fetchAllEvents]);

  console.log('🔍 [useEventsList] Hook retornando:', { 
    events: events.length, 
    loading, 
    error,
    sampleEvent: events.length > 0 ? events[0] : null
  });
  console.log('🔍 [useEventsList] Hook completado, retornando resultado');
  return { events, loading, error };
};
