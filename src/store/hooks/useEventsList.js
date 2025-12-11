import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../config/supabase';


  if (!event) return null;

  let displayImageUrl = `https://placehold.co/80x80/E0F2F7/000?text=${event.nombre ? event.nombre.charAt(0) : 'E'}`;
  if (event.imagenes) {
    try {
      const imageUrls = JSON.parse(event.imagenes);
      displayImageUrl = imageUrls.obraImagen || imageUrls.portada || imageUrls.banner || displayImageUrl;
    } catch (e) {
      console.error('Error parsing event images JSON:', e);
    }
  }

  return {
    id: event.id,
    name: event.nombre,
    date: event.fecha_evento,
    venue: event.recinto,
    imageUrl: displayImageUrl,
    slug: event.slug,
  };
};

export 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
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
        .eq('activo', true)
        .eq('oculto', false);

      if (supabaseError) {
        throw supabaseError;
      }

      let rows = data || [];

      // Fallback: si no hay eventos, reintentar sin el filtro 'oculto=false'
      if (!rows.length) {
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
        
        if (!errFallback && Array.isArray(dataFallback)) {
          rows = dataFallback;
        }
      }

      // Obtener información de recintos por separado
      const recintoIds = [...new Set([
        ...(rows || []).map(e => e.recinto).filter(Boolean),
        ...(rows || []).map(e => e.recinto_id).filter(Boolean)
      ])];
      
      let recintosData = {};
      if (recintoIds.length > 0) {
        const { data: recintos, error: recintosError } = await supabase
          .from('recintos')
          .select('id, nombre, direccion, ciudad, pais')
          .in('id', recintoIds);
        
        if (!recintosError && recintos) {
          recintosData = recintos.reduce((acc, recinto) => {
            acc[recinto.id] = recinto;
            return acc;
          }, {});
        }
      }

      // Map raw Supabase data to the format expected by EventListWidget
      const formattedEvents = rows.map(event => {
        const recintoId = event.recinto || event.recinto_id;
        const recintoInfo = recintosData[recintoId];
        
        return {
          ...normalizeEventData(event),
          venue: recintoInfo ? recintoInfo.nombre : null,
          venueInfo: recintoInfo || null,
          estadoVenta: event.estadoVenta || 'disponible',
          descripcion: event.descripcion || '',
          tags: event.tags || []
        };
      });

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events list:', err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  return { events, loading, error };
};
