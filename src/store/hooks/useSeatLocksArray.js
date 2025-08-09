import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../cartStore';
import { toast } from 'react-hot-toast';



const useSeatLocksArray = (funcionId, userId, enabled = false) => {
  const channelRef = useRef(null);
  const {
    lockedSeats,
    setLockedSeats,
    lockSeat,
    unlockSeat
  } = useSeatLockStore();
  const { cart, removeFromCart } = useCartStore();

  const fetchLockedSeats = useCallback(async () => {
    if (!funcionId) {
      setLockedSeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('seat_id, session_id, locked_at, status, expires_at')
        .eq('funcion_id', funcionId);

      if (error) throw error;

      const now = new Date();
      const validSeats = data.filter(item => {
        if (!item.expires_at) return false;
        return new Date(item.expires_at) > now;
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

          // --- NUEVO: Si algún asiento del carrito ya no está disponible, avisar y eliminarlo ---
          if (cart && cart.length > 0) {
            const lockedIds = updatedSeats.map(s => s.seat_id);
            cart.forEach(item => {
              const seatId = item.sillaId || item.id || item._id;
              if (!lockedIds.includes(seatId)) {
                toast.error('Un asiento de tu carrito fue bloqueado o comprado por otro usuario.');
                removeFromCart(seatId);
              }
            });
          }
          // --- FIN NUEVO ---

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
  }, [funcionId, enabled, fetchLockedSeats, setLockedSeats, cart, removeFromCart]);

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
