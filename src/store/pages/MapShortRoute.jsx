import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import { supabase } from '../../supabaseClient';

const MapShortRoute = () => {
  const { eventSlug } = useParams(); // Permitir slug opcional en la ruta
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const funcion = searchParams.get('funcion');
    
    // Asegurar que el session_id se inicialice antes de redirigir
    // Esto previene problemas con session_id no inicializado
    if (typeof window !== 'undefined' && window.crypto) {
      const storedSessionId = localStorage.getItem('anonSessionId');
      if (!storedSessionId) {
        // Generar session_id si no existe
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('anonSessionId', newSessionId);
        console.log('[MapShortRoute] Session ID inicializado:', newSessionId);
      }
    }
    
    const loadEventAndRedirect = async () => {
      // Si ya tenemos el slug del evento en la URL, usar directamente
      if (eventSlug && funcion) {
        const funcionId = parseInt(funcion, 10);
        if (Number.isFinite(funcionId) && funcionId > 0) {
          console.log(`[MapShortRoute] URL amigable detectada: /store/eventos/${eventSlug}/map?funcion=${funcionId}`);
          // No necesitamos redirigir, solo asegurarnos de que la ruta sea correcta
          // La ruta /eventos/:eventSlug/map ya maneja esto correctamente
          setLoading(false);
          return;
        }
      }

      // Si no hay función, redirigir al store
      if (!funcion) {
        if (eventSlug) {
          // Si tenemos slug pero no función, redirigir a la página del evento
          navigate(`/store/eventos/${eventSlug}`, { replace: true });
        } else {
          navigate('/store', { replace: true });
        }
        return;
      }

      const funcionId = parseInt(funcion, 10);
      if (!Number.isFinite(funcionId) || funcionId <= 0) {
        console.warn('[MapShortRoute] funcion inválido:', funcion);
        if (eventSlug) {
          navigate(`/store/eventos/${eventSlug}`, { replace: true });
        } else {
          navigate('/store', { replace: true });
        }
        return;
      }

      try {
        setLoading(true);
        
        // Si ya tenemos el eventSlug, no necesitamos buscar el evento
        if (eventSlug) {
          console.log(`[MapShortRoute] Usando slug del evento: ${eventSlug}`);
          // Verificar que el evento existe y tiene el slug correcto
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
            .select('id, evento_id, evento')
            .eq('id', funcionId)
            .single();

          if (funcionError) throw funcionError;
          const eventoId = funcionData.evento_id || funcionData.evento;
          
          if (eventoId !== eventoData.id) {
            throw new Error('La función no pertenece a este evento');
          }

          // Todo está correcto, no necesitamos redirigir
          setLoading(false);
          return;
        }

        // Si no tenemos slug, buscar el evento desde la función
        // Obtener la función y el evento asociado
        // Intentar primero con el esquema nuevo (evento_id)
        let { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('id, evento_id')
          .eq('id', funcionId)
          .single();

        // Si falla, intentar con el esquema antiguo (evento)
        if (funcionError || !funcionData) {
          ({ data: funcionData, error: funcionError } = await supabase
            .from('funciones')
            .select('id, evento')
            .eq('id', funcionId)
            .single());
        }

        if (funcionError) throw funcionError;
        if (!funcionData) {
          throw new Error('Función no encontrada');
        }

        // Obtener el ID del evento (puede ser evento_id o evento dependiendo del esquema)
        const eventoId = funcionData.evento_id || funcionData.evento;
        if (!eventoId) {
          throw new Error('La función no tiene un evento asociado');
        }

        // Obtener el slug del evento
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, slug')
          .eq('id', eventoId)
          .single();

        if (eventoError) throw eventoError;
        if (!eventoData || !eventoData.slug) {
          throw new Error('Evento no encontrado o sin slug');
        }

        const finalEventSlug = eventoData.slug;
        
        // Redirigir a la vista del mapa dentro del contexto del evento
        // Esto mostrará el mapa sincronizado con el evento (más cool)
        console.log(`[MapShortRoute] Redirigiendo a: /store/eventos/${finalEventSlug}/map?funcion=${funcionId}`);
        navigate(`/store/eventos/${finalEventSlug}/map?funcion=${funcionId}`, { replace: true });
      } catch (error) {
        console.error('[MapShortRoute] Error cargando evento:', error);
        console.error('[MapShortRoute] Detalles del error:', {
          message: error.message,
          funcionId,
          funcionError: error.code || error.message
        });
        
        // Si falla, intentar redirigir directamente a seat-selection como fallback
        try {
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
        } catch (navError) {
          console.error('[MapShortRoute] Error en redirección de fallback:', navError);
          // Último recurso: redirigir a la página principal del store
          navigate('/store', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    loadEventAndRedirect();
  }, [navigate, searchParams, eventSlug]);

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


