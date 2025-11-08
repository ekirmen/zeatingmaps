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
        
        // Verificar que el evento existe
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, slug')
          .ilike('slug', eventSlug)
          .maybeSingle();

        if (eventoError) throw eventoError;
        if (!eventoData) {
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

        setIsValid(true);
      } catch (error) {
        console.error('[EventMapPage] Error validando:', error);
        // Si falla la validación, redirigir a seat-selection como fallback
        navigate(`/store/seat-selection/${funcionId}`, { replace: true });
      } finally {
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
