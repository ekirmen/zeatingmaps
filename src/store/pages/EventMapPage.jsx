import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { supabase } from '../../supabaseClient';
import SeatSelectionPage from './SeatSelectionPage';

const EventMapPage = () => {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  const funcionParam = searchParams.get('funcion');

  const funcionId = useMemo(() => {
    if (!funcionParam) return null;
    const parsed = parseInt(funcionParam, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return String(parsed);
  }, [funcionParam]);

  // Validar que el evento y función coincidan
  useEffect(() => {
    const validateEventAndFunction = async () => {
      if (!eventSlug || !funcionId) {
        if (!funcionId && eventSlug) {
          navigate(`/store/eventos/${eventSlug}`, { replace: true });
        } else {
          navigate('/store', { replace: true });
        }
        return;
      }

      try {
        setValidating(true);
        
        console.log(`[EventMapPage] Validando evento slug: "${eventSlug}" con función: ${funcionId}`);
        
        // Verificar que el evento existe
        // Usar .eq() para búsqueda exacta (case-sensitive) ya que los slugs deben ser únicos
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, slug')
          .eq('slug', eventSlug)
          .maybeSingle();

        if (eventoError) {
          console.error('[EventMapPage] Error consultando evento:', eventoError);
          throw eventoError;
        }
        
        if (!eventoData) {
          console.warn(`[EventMapPage] Evento no encontrado con slug: "${eventSlug}"`);
          // Si el evento no existe pero tenemos función, usar seat-selection como fallback
          if (funcionId) {
            console.log(`[EventMapPage] Redirigiendo a seat-selection como fallback`);
            navigate(`/store/seat-selection/${funcionId}`, { replace: true });
            return;
          }
          throw new Error('Evento no encontrado');
        }

        console.log(`[EventMapPage] Evento encontrado: ${eventoData.id} (slug: ${eventoData.slug})`);

        // Verificar que la función pertenece a este evento
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('id, evento_id')
          .eq('id', funcionId)
          .single();

        if (funcionError) {
          console.error('[EventMapPage] Error consultando función:', funcionError);
          throw funcionError;
        }
        
        const eventoId = funcionData.evento_id;
        console.log(`[EventMapPage] Función ${funcionId} pertenece a evento: ${eventoId}`);
        
        if (eventoId !== eventoData.id) {
          console.warn(`[EventMapPage] La función ${funcionId} no pertenece al evento ${eventoData.id}`);
          // Si la función no pertenece al evento pero tenemos función, usar seat-selection como fallback
          if (funcionId) {
            console.log(`[EventMapPage] Redirigiendo a seat-selection como fallback`);
            navigate(`/store/seat-selection/${funcionId}`, { replace: true });
            return;
          }
          throw new Error('La función no pertenece a este evento');
        }

        console.log(`[EventMapPage] Validación exitosa, mostrando mapa`);
        setIsValid(true);
      } catch (error) {
        console.error('[EventMapPage] Error validando:', error);
        // Si hay un error y tenemos función, usar seat-selection como fallback
        if (funcionId && error.message !== 'Evento no encontrado' && !error.message.includes('no pertenece')) {
          console.log(`[EventMapPage] Error inesperado, redirigiendo a seat-selection como fallback`);
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
        } else if (!funcionId) {
          // Si no hay función, redirigir a la página principal
          navigate('/store', { replace: true });
        } else {
          // Mantener en estado de validación para mostrar error
          setValidating(false);
        }
      } finally {
        // Actualizar validating - si hubo una redirección, el componente se desmontará
        setValidating(false);
      }
    };

    validateEventAndFunction();
  }, [eventSlug, funcionId, navigate]);

  if (validating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isValid || !funcionId) {
    return null;
  }

  return (
    <SeatSelectionPage
      initialFuncionId={funcionId}
      autoRedirectToEventMap={false}
    />
  );
};

export default EventMapPage;
