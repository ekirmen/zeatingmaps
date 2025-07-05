import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { isUuid } from '../utils/isUuid';
import { lockSeat, unlockSeat } from '../backoffice/services/seatLocks';
import useSeatLocksArray from '../store/hooks/useSeatLocksArray';
import getCartSessionId from '../utils/getCartSessionId';
import './SeatMap.css';

const SeatMap = ({ funcionId }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [loading, setLoading] = useState(true);

  useSeatLocksArray(
    funcionId,
    setSeats,
    getCartSessionId,
    process.env.REACT_APP_USE_FIREBASE === 'true'
  );

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .eq('funcion_id', funcionId);
        if (error) throw error;
        const selectedMap = {};
        data.forEach((seat) => {
          if (seat.status === 'selected' || seat.status === 'blocked') {
            selectedMap[seat.id] = {
              id: seat.id,
              status: seat.status,
              selectedBy: seat.selected_by,
            };
          }
        });
        setSeats(data);
        setSelectedSeats(selectedMap);
      } catch (err) {
        console.error('Error fetching seats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (funcionId) fetchSeats();
  }, [funcionId]);

  useEffect(() => {
    if (!funcionId) return undefined;
    const subscription = supabase
      .channel('seats-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `funcion_id=eq.${funcionId}`,
        },
        (payload) => {
          console.log('Cambio en tiempo real recibido:', payload);
          if (payload.eventType === 'INSERT') {
            setSeats((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setSeats((prev) =>
              prev.map((seat) =>
                seat.id === payload.new.id ? payload.new : seat
              )
            );
            if (
              payload.new.status === 'selected' ||
              payload.new.status === 'blocked'
            ) {
              setSelectedSeats((prev) => ({
                ...prev,
                [payload.new.id]: {
                  id: payload.new.id,
                  status: payload.new.status,
                  selectedBy: payload.new.selected_by,
                },
              }));
            } else {
              setSelectedSeats((prev) => {
                const updated = { ...prev };
                delete updated[payload.new.id];
                return updated;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setSeats((prev) => prev.filter((s) => s.id !== payload.old.id));
            setSelectedSeats((prev) => {
              const updated = { ...prev };
              delete updated[payload.old.id];
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [funcionId]);

  const handleSeatSelect = async (seatId) => {
    if (!isUuid(seatId)) return;
    try {
      const currentSeat = seats.find((s) => s.id === seatId);
      if (
        currentSeat &&
        (currentSeat.status === 'blocked' ||
          (currentSeat.status === 'selected' &&
            currentSeat.selected_by !== supabase.auth.user()?.id))
      ) {
        alert('Este asiento ya está seleccionado por otro usuario');
        return;
      }
      const user = supabase.auth.user();
      const isCurrentlySelected =
        selectedSeats[seatId] && selectedSeats[seatId].selectedBy === user?.id;
      const newStatus = isCurrentlySelected ? 'available' : 'selected';
      const { error } = await supabase
        .from('seats')
        .update({
          status: newStatus,
          selected_by: isCurrentlySelected ? null : user?.id,
          selected_at: isCurrentlySelected ? null : new Date().toISOString(),
        })
        .eq('id', seatId);
      if (error) throw error;

      if (process.env.REACT_APP_USE_FIREBASE === 'true') {
        if (isCurrentlySelected) {
          await unlockSeat(seatId, funcionId);
        } else {
          await lockSeat(seatId, 'bloqueado', funcionId);
        }
      }
    } catch (err) {
      console.error('Error al seleccionar asiento:', err);
    }
  };

  return (
    <div className="seat-map">
      <h2>Selección de Asientos</h2>
      {loading ? (
        <p>Cargando asientos...</p>
      ) : (
        <div className="seats-container">
          {seats.map((seat) => (
            <div
              key={seat.id}
              className={`seat ${seat.status}`}
              onClick={() => handleSeatSelect(seat.id)}
              title={
                seat.status === 'selected'
                  ? `Seleccionado por ${seat.selected_by}`
                  : seat.name
              }
            >
              {seat.name || seat._id}
            </div>
          ))}
        </div>
      )}
      <div className="legend">
        <div className="legend-item">
          <div className="seat-sample available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample selected"></div>
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample blocked"></div>
          <span>Bloqueado</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
