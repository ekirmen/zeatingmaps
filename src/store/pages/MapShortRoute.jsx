import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { supabase } from '../../supabaseClient';

const MapShortRoute = () => {
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
      if (!funcion) {
        navigate('/store', { replace: true });
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

        const eventSlug = eventoData.slug;
        
        // Redirigir a la vista del mapa dentro del contexto del evento
        // Esto mostrará el mapa sincronizado con el evento (más cool)
        navigate(`/store/eventos/${eventSlug}/map?funcion=${funcionId}`, { replace: true });
      } catch (error) {
        console.error('[MapShortRoute] Error cargando evento:', error);
        // Si falla, redirigir a la vista simple de seat-selection como fallback
        navigate(`/store/seat-selection/${funcionId}`, { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadEventAndRedirect();
  }, [navigate, searchParams]);

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


