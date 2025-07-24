import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';

const LOCK_EXPIRATION_MINUTES = 15;

const useSeatLocksArray = (funcionId, userId, enabled = false) => {
  const channelRef = useRef(null);
  const {
    lockedSeats,
    setLockedSeats,
    lockSeat,
    unlockSeat
  } = useSeatLockStore();

  const fetchLockedSeats = useCallback(async () => {
    if (!funcionId) {
      setLockedSeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('seat_id, session_id, locked_at')
        .eq('funcion_id', funcionId);

      if (error) throw error;

      const now = new Date();
      const validSeats = data.filter(item => {
        const ageMinutes = (now - new Date(item.locked_at)) / 60000;
        return ageMinutes <= LOCK_EXPIRATION_MINUTES;
      });

      console.log('[SEAT_LOCK_HOOK] Cargando asientos bloqueados:', validSeats);
      setLockedSeats(validSeats);
    } catch (e) {
      console.error('[SEAT_LOCK_HOOK] Error al obtener asientos bloqueados:', e);
      setLockedSeats([]);
    }
  }, [funcionId, setLockedSeats]);

  useEffect(() => {
    if (!enabled || !funcionId) {
      console.warn('[SEAT_LOCK_HOOK] Hook deshabilitado o sin funcionId');
      setLockedSeats([]);
      return;
    }

    // Limpia canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    fetchLockedSeats();

    const channel = supabase.channel(`seat-locks-realtime-${funcionId}`);
    channelRef.current = channel;

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'seat_locks',
        filter: `funcion_id=eq.${funcionId}`,
      },
      (payload) => {
        console.log('[SEAT_LOCK_HOOK] Payload realtime recibido:', payload);
        setLockedSeats(currentSeats => {
          let updatedSeats = [...currentSeats];
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const idx = updatedSeats.findIndex(s => s.seat_id === payload.new.seat_id);
            if (idx > -1) {
              updatedSeats[idx] = payload.new;
            } else {
              updatedSeats.push(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            updatedSeats = updatedSeats.filter(s => s.seat_id !== payload.old.seat_id);
          }
          return updatedSeats;
        });
      }
    ).subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('[SEAT_LOCK_HOOK] Canal eliminado en limpieza de efecto');
      }
    };
  }, [funcionId, enabled, fetchLockedSeats, setLockedSeats]);

  const isSeatLocked = useCallback((seatId) => {
    return lockedSeats.some(s => s.seat_id === seatId);
  }, [lockedSeats]);

  const isSeatLockedByMe = useCallback((seatId) => {
    const sessionId = localStorage.getItem('anonSessionId');
    return lockedSeats.some(s => s.seat_id === seatId && s.session_id === sessionId);
  }, [lockedSeats]);

  return {
    lockedSeats,
    isSeatLocked,
    isSeatLockedByMe,
    lockSeat,
    unlockSeat,
  };
};

export default useSeatLocksArray;
