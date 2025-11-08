import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Alert, Spin } from 'antd';
import LazySeatingMap from '../../components/LazySeatingMap';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../supabaseClient';

const SeatSelectionPage = ({ initialFuncionId, autoRedirectToEventMap = true }) => {
  const params = useParams();
  const funcionIdFromParams = params?.funcionId;
  const funcionId = initialFuncionId ?? funcionIdFromParams;
  const navigate = useNavigate();
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(autoRedirectToEventMap);
  const [redirectFailed, setRedirectFailed] = useState(!autoRedirectToEventMap);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const cartItems = useCartStore((state) => state.items);
  
  const {
    subscribeToFunction,
    unsubscribe,
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe
  } = useSeatLockStore();
  const lockedSeats = useSeatLockStore((state) => state.lockedSeats);

  const ensureSessionId = useCallback(() => {
    if (typeof window === 'undefined') return;
    const storedSessionId = window.localStorage.getItem('anonSessionId');
    if (!storedSessionId) {
      try {
        const newSessionId = window.crypto?.randomUUID?.();
        if (newSessionId) {
          window.localStorage.setItem('anonSessionId', newSessionId);
        }
      } catch (sessionError) {
        console.warn('[SeatSelectionPage] No se pudo inicializar session_id:', sessionError);
      }
    }
  }, []);

  useEffect(() => {
    ensureSessionId();
  }, [ensureSessionId]);

  useEffect(() => {
    if (!funcionId) {
      setIsRedirecting(false);
      setRedirectFailed(true);
      setError('Función inválida');
      setLoading(false);
      return;
    }

    if (!autoRedirectToEventMap) {
      setIsRedirecting(false);
      setRedirectFailed(true);
      return;
    }

    const attemptRedirect = async () => {
      setError(null);
      try {
        const funcionNumeric = parseInt(funcionId, 10);
        if (!Number.isFinite(funcionNumeric) || funcionNumeric <= 0) {
          throw new Error('Función inválida');
        }

        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('evento_id')
          .eq('id', funcionNumeric)
          .maybeSingle();

        if (funcionError) throw funcionError;

        const eventoId = funcionData?.evento_id;
        if (!eventoId) {
          throw new Error('La función no tiene un evento asociado');
        }

        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('slug')
          .eq('id', eventoId)
          .maybeSingle();

        if (eventoError) throw eventoError;

        const eventSlug = eventoData?.slug;
        if (!eventSlug) {
          throw new Error('El evento no tiene un slug configurado');
        }

        navigate(`/store/eventos/${eventSlug}/map?funcion=${funcionNumeric}`, { replace: true });
      } catch (redirectError) {
        console.error('[SeatSelectionPage] Error preparando redirección:', redirectError);
        setError(redirectError.message || 'No se pudo redirigir al mapa del evento');
        setRedirectFailed(true);
        setLoading(true);
      } finally {
        setIsRedirecting(false);
      }
    };

    attemptRedirect();
  }, [autoRedirectToEventMap, funcionId, navigate]);

  // Suscribirse a función
  useEffect(() => {
    if (isRedirecting || !redirectFailed || !funcionId) {
      return undefined;
    }

    subscribeToFunction(funcionId);
    return () => unsubscribe();
  }, [funcionId, subscribeToFunction, unsubscribe, isRedirecting, redirectFailed]);

  // Cargar mapa
  useEffect(() => {
    if (isRedirecting || !redirectFailed || !funcionId) {
      return;
    }

    const loadMapa = async () => {
      try {
        setLoading(true);
        setError(null);

        const funcionNumeric = parseInt(funcionId, 10);
        const { data: funcion, error: funcionError } = await supabase
          .from('funciones')
          .select('sala_id')
          .eq('id', funcionNumeric)
          .single();

        if (funcionError) throw funcionError;

        // Obtener mapa
        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', funcion.sala_id)
          .eq('estado', 'active')
          .single();

        if (mapaError) throw mapaError;

        setMapa(mapaData);
      } catch (err) {
        console.error('Error cargando mapa:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMapa();
  }, [funcionId, redirectFailed, isRedirecting]);

  const handleSeatToggle = async (seat) => {
    // Asegurarnos de que toggleSeat reciba la función asociada
    await toggleSeat({ ...seat, funcionId });
  };

  if (isRedirecting || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="seat-selection-page p-6">
      <Card title="Selección de Asientos" className="mb-6">
        {mapa ? (
          <LazySeatingMap
            mapa={mapa}
            funcionId={funcionId}
            selectedSeats={cartItems.map(item => item.sillaId || item.id || item._id)}
            onSeatToggle={handleSeatToggle}
            isSeatLocked={isSeatLocked}
            isSeatLockedByMe={isSeatLockedByMe}
            isTableLocked={isTableLocked}
            isTableLockedByMe={isTableLockedByMe}
            isAnySeatInTableLocked={isAnySeatInTableLocked}
            areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
            lockedSeats={lockedSeats}
          />
        ) : (
          <Alert
            message="No hay mapa disponible"
            description="No se encontró un mapa de asientos para esta función."
            type="warning"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default SeatSelectionPage;
