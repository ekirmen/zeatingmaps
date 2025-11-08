import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import { supabase } from '../../supabaseClient';

const MapShortRoute = () => {
  const { eventSlug } = useParams(); // Permitir slug opcional en la ruta (puede ser "r" para ruta corta)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const funcion = searchParams.get('funcion');
    
    // Asegurar que el session_id se inicialize antes de redirigir
    if (typeof window !== 'undefined' && window.crypto) {
      const storedSessionId = localStorage.getItem('anonSessionId');
      if (!storedSessionId) {
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('anonSessionId', newSessionId);
        console.log('[MapShortRoute] Session ID inicializado:', newSessionId);
      }
    }
    
    const loadEventAndRedirect = async () => {
      // Si tenemos un slug válido (no "r") y una función, 
      // y estamos en la ruta /eventos/:eventSlug/map, dejar que EventMapPage maneje
      if (eventSlug && eventSlug !== 'r' && funcion) {
        const funcionId = parseInt(funcion, 10);
        if (Number.isFinite(funcionId) && funcionId > 0) {
          console.log(`[MapShortRoute] URL amigable válida detectada: /store/eventos/${eventSlug}/map?funcion=${funcionId}`);
          // No hacer nada, la ruta /eventos/:eventSlug/map ya maneja esto
          setLoading(false);
          return;
        }
      }
      
      // Si no hay función, redirigir a la página del evento (será manejado por ModernEventPage)
      // MapShortRoute solo debe manejar rutas con ?funcion= para rutas cortas
      if (!funcion) {
        if (eventSlug) {
          // Redirigir a la página del evento (ModernEventPage lo manejará)
          console.log(`[MapShortRoute] No hay función, redirigiendo a página del evento: /store/eventos/${eventSlug}`);
          navigate(`/store/eventos/${eventSlug}`, { replace: true });
        } else {
          // Si no hay slug ni función, redirigir a la página principal
          console.log('[MapShortRoute] No hay función ni slug, redirigiendo a /store');
          navigate('/store', { replace: true });
        }
        return;
      }

      const funcionId = parseInt(funcion, 10);
      if (!Number.isFinite(funcionId) || funcionId <= 0) {
        console.warn('[MapShortRoute] funcion inválido:', funcion);
        navigate('/store', { replace: true });
        return;
      }

      try {
        setLoading(true);
        
        // Si tenemos un slug válido (no "r"), verificar que el evento existe
        // Si el slug es "r" o no existe, buscar el evento desde la función
        if (eventSlug && eventSlug !== 'r') {
          console.log(`[MapShortRoute] Verificando slug del evento: ${eventSlug}`);
          
          // Verificar que el evento existe
          const { data: eventoData, error: eventoError } = await supabase
            .from('eventos')
            .select('id, slug')
            .ilike('slug', eventSlug)
            .maybeSingle();

          if (eventoError) throw eventoError;
          if (!eventoData || !eventoData.slug) {
            throw new Error('Evento no encontrado');
          }

               // Verificar que la función pertenece a este evento
               const { data: funcionData, error: funcionError } = await supabase
                 .from('funciones')
                 .select('id, evento_id')
                 .eq('id', funcionId)
                 .single();

               if (funcionError) throw funcionError;
               const eventoId = funcionData.evento_id;
          
          if (eventoId !== eventoData.id) {
            throw new Error('La función no pertenece a este evento');
          }

          // Todo está correcto, EventMapPage manejará el resto
          console.log(`[MapShortRoute] Validación exitosa para slug: ${eventSlug}`);
          setLoading(false);
          return;
        }
        
        // Ruta corta: buscar el evento desde la función (slug es "r" o no existe)
        console.log(`[MapShortRoute] Ruta corta: buscando evento desde función ${funcionId}`);

        // Obtener la función y el evento asociado
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('id, evento_id')
          .eq('id', funcionId)
          .single();

        if (funcionError) throw funcionError;
        if (!funcionData) {
          throw new Error('Función no encontrada');
        }

        // Obtener el ID del evento (solo usar evento_id)
        const eventoId = funcionData.evento_id;
        if (!eventoId) {
          throw new Error('La función no tiene un evento asociado');
        }

        // Obtener el slug del evento
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, slug, nombre')
          .eq('id', eventoId)
          .single();

        if (eventoError) throw eventoError;
        if (!eventoData) {
          throw new Error('Evento no encontrado');
        }

        // Si el evento no tiene slug, usar seat-selection como fallback
        if (!eventoData.slug) {
          console.warn(`[MapShortRoute] Evento ${eventoData.id} no tiene slug, usando seat-selection`);
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
          return;
        }

        const finalEventSlug = eventoData.slug;
        
        // Si el slug final es el mismo que el slug actual y estamos en /map, 
        // no redirigir (evitar bucle infinito) - dejar que EventMapPage lo maneje
        if (finalEventSlug === eventSlug && window.location.pathname.includes('/map')) {
          console.log(`[MapShortRoute] Slug coincide con la ruta actual, dejando que EventMapPage maneje la ruta`);
          setLoading(false);
          return;
        }
        
        // Redirigir a la vista del mapa con el slug correcto solo si es diferente
        console.log(`[MapShortRoute] Redirigiendo a: /store/eventos/${finalEventSlug}/map?funcion=${funcionId}`);
        navigate(`/store/eventos/${finalEventSlug}/map?funcion=${funcionId}`, { replace: true });
      } catch (error) {
        console.error('[MapShortRoute] Error cargando evento:', error);
        console.error('[MapShortRoute] Detalles:', {
          message: error.message,
          funcionId,
          eventSlug
        });
        
        // Si es ruta corta (slug es "r" o no existe), usar seat-selection como fallback
        if ((!eventSlug || eventSlug === 'r') && funcionId) {
          console.log(`[MapShortRoute] Usando fallback: /store/seat-selection/${funcionId}`);
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
        } else if (eventSlug && eventSlug !== 'r') {
          // Si tenemos slug válido pero falló, mostrar error
          setLoading(false);
        } else {
          navigate('/store', { replace: true });
        }
      }
    };

    loadEventAndRedirect();
  }, [navigate, searchParams, eventSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mostrar un spinner mientras se carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return null;
};

export default MapShortRoute;


