import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Spin } from '../../utils/antdComponents';
import { supabase } from '../../supabaseClient';

const MapShortRoute = () => {
  const { eventSlug } = useParams(); // Permitir slug opcional en la ruta (puede ser "r" para ruta corta)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const funcion = searchParams.get('funcion');

    // Asegurar que el session_id se inicialize antes de redirigir (no bloqueante)
    if (typeof window !== 'undefined' && window.crypto) {
      const storedSessionId = localStorage.getItem('anonSessionId');
      if (!storedSessionId) {
        // Usar requestIdleCallback para no bloquear el render inicial
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            const newSessionId = crypto.randomUUID();
            localStorage.setItem('anonSessionId', newSessionId);
          });
        } else {
          setTimeout(() => {
            const newSessionId = crypto.randomUUID();
            localStorage.setItem('anonSessionId', newSessionId);
          }, 0);
        }
      }
    }

    const loadEventAndRedirect = async () => {
        // Si tenemos un slug v¡lido (no "r") y una funci³n,
        // y estamos en la ruta /eventos/:eventSlug/map, dejar que EventMapPage maneje
        if (eventSlug && eventSlug !== 'r' && funcion) {
          const funcionId = parseInt(funcion, 10);
          if (Number.isFinite(funcionId) && funcionId > 0) {
            // Redirigir inmediatamente sin hacer queries adicionales

            return;
          }
        }

      // Si no hay funci³n, redirigir a la p¡gina del evento (ser¡ manejado por ModernEventPage)
      // MapShortRoute solo debe manejar rutas con ?funcion= para rutas cortas
      if (!funcion) {
        if (eventSlug) {
          // Redirigir a la p¡gina del evento (ModernEventPage lo manejar¡)
          navigate(`/store/eventos/${eventSlug}`, { replace: true });
        } else {
          // Si no hay slug ni funci³n, redirigir a la p¡gina principal
          navigate('/store', { replace: true });
        }
        return;
      }

      const funcionId = parseInt(funcion, 10);
      if (!Number.isFinite(funcionId) || funcionId <= 0) {
        navigate('/store', { replace: true });
        return;
      }

      try {
        setLoading(true);

        // Si tenemos un slug v¡lido (no "r"), verificar que el evento existe
        // Si el slug es "r" o no existe, buscar el evento desde la funci³n
        if (eventSlug && eventSlug !== 'r') {
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

               // Verificar que la funci³n pertenece a este evento
               const { data: funcionData, error: funcionError } = await supabase
                 .from('funciones')
                 .select('id, evento_id')
                 .eq('id', funcionId)
                 .single();

               if (funcionError) throw funcionError;
               const eventoId = funcionData.evento_id;

          if (eventoId !== eventoData.id) {
            throw new Error('La funci³n no pertenece a este evento');
          }

          // Todo est¡ correcto, EventMapPage manejar¡ el resto
          setLoading(false);
          return;
        }

        // Ruta corta: buscar el evento desde la funci³n (slug es "r" o no existe)
        // Optimizar: hacer una sola query con join para reducir round-trips
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('id, evento_id, eventos!inner(id, slug, nombre)')
          .eq('id', funcionId)
          .single();

        if (funcionError) throw funcionError;
        if (!funcionData) {
          throw new Error('Funci³n no encontrada');
        }

        // Obtener el evento desde la relaci³n
        const eventoData = funcionData.eventos;
        if (!eventoData) {
          throw new Error('La funci³n no tiene un evento asociado');
        }

        // Si el evento no tiene slug, usar seat-selection como fallback
        if (!eventoData.slug) {
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
          return;
        }

        const finalEventSlug = eventoData.slug;

        // Si el slug final es el mismo que el slug actual y estamos en /map,
        // no redirigir (evitar bucle infinito) - dejar que EventMapPage lo maneje
        if (finalEventSlug === eventSlug && window.location.pathname.includes('/map')) {
          setLoading(false);
          return;
        }

        // Redirigir a la vista del mapa con el slug correcto solo si es diferente
        navigate(`/store/eventos/${finalEventSlug}/map?funcion=${funcionId}`, { replace: true });
      } catch (error) {
        // Si es ruta corta (slug es "r" o no existe), usar seat-selection como fallback
        if ((!eventSlug || eventSlug === 'r') && funcionId) {
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
        } else if (eventSlug && eventSlug !== 'r') {
          // Si tenemos slug v¡lido pero fall³, mostrar error
          setLoading(false);
        } else {
          navigate('/store', { replace: true });
        }
      }
    };

    loadEventAndRedirect();
  }, [navigate, searchParams, eventSlug, location.pathname]); 
  
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




