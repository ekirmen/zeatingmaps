import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Alert, Spin } from 'antd';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../supabaseClient';

const SeatSelectionPage = () => {
  const { funcionId } = useParams();
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Suscribirse a función
  useEffect(() => {
    if (!funcionId) return;
    subscribeToFunction(funcionId);
    return () => unsubscribe();
  }, [funcionId, subscribeToFunction, unsubscribe]);

  // Cargar mapa
  useEffect(() => {
    const loadMapa = async () => {
      if (!funcionId) return;
      
      try {
        setLoading(true);
        
        // Obtener función para obtener sala_id
        const { data: funcion, error: funcionError } = await supabase
          .from('funciones')
          .select('sala_id')
          .eq('id', funcionId)
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
  }, [funcionId]);

  const handleSeatToggle = (seat) => {
    toggleSeat(seat, funcionId);
  };

  if (loading) {
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
          <SeatingMapUnified
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
