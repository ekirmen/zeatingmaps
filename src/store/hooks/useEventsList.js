// src/hooks/useEventsList.js (or similar path)

import { useState, useEffect, useCallback } from 'react'; // Corrected import syntax
import { supabase } from '../../supabaseClient'; // Adjust path as necessary
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
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('🔍 [useEventsList] Estado inicial:', { events, loading, error });

  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useEventsList] Iniciando fetch de eventos...');
      
      // Fetch all active events
      // Use explicit foreign key relationship to avoid ambiguity
      const { data, error: supabaseError } = await supabase
        .from('eventos')
        .select(`
          id,
          nombre,
          fecha_evento,
          recinto,
          imagenes,
          slug,
          recintos!recinto_id (
            nombre
          )
        `) // Specify the foreign key relationship explicitly
        .eq('activo', true) // Only fetch active events
        .eq('oculto', false) // Only fetch events that are not hidden
        .order('fecha_evento', { ascending: true }); // Order by date

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
            imagenes,
            slug,
            recintos!recinto_id (
              nombre
            )
          `)
          .eq('activo', true)
          .order('fecha_evento', { ascending: true });
        
        console.log('🔍 [useEventsList] Fallback query resultado:', { dataFallback, error: errFallback });
        
        if (!errFallback && Array.isArray(dataFallback)) {
          rows = dataFallback;
          console.log('🔍 [useEventsList] Eventos encontrados (fallback):', rows.length);
        }
      }

      // Map raw Supabase data to the format expected by EventListWidget
      const formattedEvents = rows.map(event => ({
        ...normalizeEventData(event),
        venue: event.recintos ? event.recintos.nombre : null // Get venue name from joined table
      }));

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
    fetchAllEvents();
  }, [fetchAllEvents]);

  console.log('🔍 [useEventsList] Hook retornando:', { events: events.length, loading, error });
  return { events, loading, error };
};
