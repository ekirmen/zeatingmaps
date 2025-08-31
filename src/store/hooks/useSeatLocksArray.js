import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useCartStore } from '../cartStore';
import { toast } from 'react-hot-toast';

const useSeatLocksArray = (funcionId, userId, enabled = false) => {
  const [lockedSeats, setLockedSeats] = useState([]);
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const { cart, removeFromCart } = useCartStore();

  const fetchLockedSeats = useCallback(async () => {
    if (!funcionId) return;

    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', funcionId)
        .eq('status', 'locked');

      if (error) {
        console.error('[SEAT_LOCK_HOOK] Error al obtener asientos bloqueados:', error);
        return;
      }

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
  }, [funcionId]);

  const lockSeat = useCallback(async (seatId) => {
    if (!funcionId || !seatId) return false;
    
    try {
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      localStorage.setItem('anonSessionId', sessionId);
      
      const { error } = await supabase
        .from('seat_locks')
        .insert({
          seat_id: seatId,
          funcion_id: funcionId,
          session_id: sessionId,
          status: 'locked',
          locked_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        });

      if (error) {
        console.error('[SEAT_LOCK_HOOK] Error al bloquear asiento:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('[SEAT_LOCK_HOOK] Error al bloquear asiento:', e);
      return false;
    }
  }, [funcionId]);

  const unlockSeat = useCallback(async (seatId) => {
    if (!funcionId || !seatId) return false;
    
    try {
      const sessionId = localStorage.getItem('anonSessionId');
      
      const { error } = await supabase
        .from('seat_locks')
        .delete()
        .eq('seat_id', seatId)
        .eq('funcion_id', funcionId)
        .eq('session_id', sessionId);

      if (error) {
        console.error('[SEAT_LOCK_HOOK] Error al desbloquear asiento:', error);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('[SEAT_LOCK_HOOK] Error al desbloquear asiento:', e);
      return false;
    }
  }, [funcionId]);

  // Memoize the cart check to prevent unnecessary re-subscriptions
  const checkCartForLockedSeats = useCallback((updatedSeats) => {
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
  }, [cart, removeFromCart]);

  useEffect(() => {
    if (!enabled || !funcionId) {
      console.warn('[SEAT_LOCK_HOOK] Hook deshabilitado o sin funcionId');
      setLockedSeats([]);
      return;
    }

    // Limpia canal anterior si existe
    if (channelRef.current) {
      console.log('[SEAT_LOCK_HOOK] Limpiando canal anterior');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    fetchLockedSeats();

    // Solo crear nuevo canal si no hay uno activo
    if (!isSubscribedRef.current) {
      const channelName = `seat-locks-realtime-${funcionId}`;
      console.log(`[SEAT_LOCK_HOOK] Creando canal: ${channelName}`);
      
      const channel = supabase.channel(channelName);
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

            // Check cart for locked seats using memoized function
            checkCartForLockedSeats(updatedSeats);

            return updatedSeats;
          });
        }
      ).subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[SEAT_LOCK_HOOK] ✅ Suscrito al canal ${channelName}`);
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[SEAT_LOCK_HOOK] ⚠️ Error en el canal, intentando reconectar...');
          isSubscribedRef.current = false;
        } else if (status === 'CLOSED') {
          console.log(`[SEAT_LOCK_HOOK] ℹ️ Canal ${channelName} cerrado.`);
          isSubscribedRef.current = false;
        }
      });
    }

    return () => {
      if (channelRef.current) {
        console.log('[SEAT_LOCK_HOOK] Limpiando canal en cleanup');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [funcionId, enabled, fetchLockedSeats, checkCartForLockedSeats]);

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
