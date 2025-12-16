import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from '../../utils/antdComponents';
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

  // Validar que el evento y funci³n coincidan
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
        // Optimizar: hacer una sola query con join para reducir round-trips
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('id, evento_id, eventos!inner(id, slug)')
          .eq('id', funcionId)
          .eq('eventos.slug', eventSlug)
          .maybeSingle();

        if (funcionError) {
          throw funcionError;
        }

        if (!funcionData || !funcionData.eventos) {
          // Si el evento no existe o la funci³n no pertenece, usar seat-selection como fallback
          if (funcionId) {
            navigate(`/store/seat-selection/${funcionId}`, { replace: true });
            return;
          }
          throw new Error('Evento o funci³n no encontrados');
        }

        setIsValid(true);
      } catch (error) {
        console.error('[EventMapPage] Error validando:', error);
        // Si hay un error y tenemos funci³n, usar seat-selection como fallback
        if (funcionId && error.message !== 'Evento no encontrado' && !error.message.includes('no pertenece')) {
          navigate(`/store/seat-selection/${funcionId}`, { replace: true });
        } else if (!funcionId) {
          // Si no hay funci³n, redirigir a la p¡gina principal
          navigate('/store', { replace: true });
        } else {
          // Mantener en estado de validaci³n para mostrar error
          setValidating(false);
        }
      } finally {
        // Actualizar validating - si hubo una redirecci³n, el componente se desmontar¡
        setValidating(false);
      }
    };

    validateEventAndFunction();
  }, [eventSlug, funcionId, navigate]);

  if (validating) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>Cargando mapa...</div>
        </div>
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


