import { create } from 'zustand';
import { supabase } from '../supabaseClient';

function isValidUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function getOrCreateAnonymousSessionId() {
  let sessionId = localStorage.getItem('anonSessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anonSessionId', sessionId);
    console.log('[SESSION] Nueva sesión anónima generada:', sessionId);
  } else {
    console.log('[SESSION] Sesión anónima existente:', sessionId);
  }
  return sessionId;
}

export const useSeatLockStore = create((set, get) => ({
  lockedSeats: [],
  channel: null,

  setLockedSeats: (seats) => {
    console.log('[SEAT_LOCK] setLockedSeats invocado:', seats);
    set({ lockedSeats: seats });
  },

  subscribeToFunction: (funcionId) => {
    console.log('[SEAT_LOCK] Suscribiéndose a función:', funcionId);

    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido, cancelando suscripción.');
      get().unsubscribe();
      set({ lockedSeats: [] });
      return;
    }

    const currentChannel = get().channel;
    if (currentChannel && currentChannel.topic === `seat-locks-channel-${funcionId}`) {
      console.log('[SEAT_LOCK] Ya suscrito a esta función.');
      return;
    }

    if (currentChannel) {
      console.log('[SEAT_LOCK] Desuscribiendo canal anterior:', currentChannel.topic);
      currentChannel.unsubscribe();
    }

    const fetchInitialLocks = async () => {
      console.log('[SEAT_LOCK] Cargando bloqueos iniciales para función:', funcionId);
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', funcionId);

      if (error) {
        console.error('[SEAT_LOCK] Error al obtener bloqueos iniciales:', error);
      } else {
        console.log('[SEAT_LOCK] Bloqueos iniciales cargados:', data);
        set({ lockedSeats: data || [] });
      }
    };
    fetchInitialLocks();

    const newChannel = supabase
      .channel(`seat-locks-channel-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_locks',
          filter: `funcion_id=eq.${funcionId}`,
        },
        (payload) => {
          console.log('[SEAT_LOCK] Evento realtime recibido:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            set((state) => {
              const updated = [
                ...state.lockedSeats.filter(
                  (seat) => seat.seat_id !== payload.new.seat_id
                ),
                payload.new,
              ];
              return { lockedSeats: updated };
            });
          }
          if (payload.eventType === 'DELETE') {
            set((state) => {
              const updated = state.lockedSeats.filter(
                (seat) => seat.seat_id !== payload.old.seat_id
              );
              return { lockedSeats: updated };
            });
          }
        }
      )
      .subscribe();

    console.log('[SEAT_LOCK] Canal suscrito:', newChannel.topic);
    set({ channel: newChannel });
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      console.log('[SEAT_LOCK] Desuscribiendo canal:', channel.topic);
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  lockSeat: async (seatId) => {
    const topic = get().channel?.topic;
    const sessionId = getOrCreateAnonymousSessionId();

    const funcionId = topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    if (!isValidUuid(seatId)) {
      console.warn('[SEAT_LOCK] seat_id inválido', seatId);
      return false;
    }

    const lockedAt = new Date().toISOString();

    const { error } = await supabase.from('seat_locks').insert({
      seat_id: seatId,
      funcion_id: parseInt(funcionId),
      session_id: sessionId,
      locked_at: lockedAt,
    });

    if (error) {
      console.error('[SEAT_LOCK] Error al bloquear asiento:', error);
      return false;
    }

    // ⚠️ Actualización local inmediata
    set((state) => ({
      lockedSeats: [
        ...state.lockedSeats.filter((s) => s.seat_id !== seatId),
        { seat_id: seatId, funcion_id: parseInt(funcionId), session_id: sessionId, locked_at: lockedAt },
      ],
    }));

    return true;
  },

  unlockSeat: async (seatId) => {
    const topic = get().channel?.topic;
    const sessionId = getOrCreateAnonymousSessionId();

    const funcionId = topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    if (!isValidUuid(seatId)) {
      console.warn('[SEAT_LOCK] seat_id inválido', seatId);
      return false;
    }
  
    const { error } = await supabase
      .from('seat_locks')
      .delete()
      .eq('seat_id', seatId)
      .eq('funcion_id', parseInt(funcionId))
      .eq('session_id', sessionId);
  
    if (error) {
      console.error('[SEAT_LOCK] Error al desbloquear asiento:', error);
      return false;
    }
  
    // ⚠️ Actualización local inmediata
    set((state) => ({
      lockedSeats: state.lockedSeats.filter((s) => s.seat_id !== seatId),
    }));
  
    return true;
  },  

  isSeatLocked: (seatId) => {
    const { lockedSeats } = get();
    return lockedSeats.some((s) => s.seat_id === seatId);
  },

  isSeatLockedByMe: (seatId) => {
    const sessionId = getOrCreateAnonymousSessionId();
    const { lockedSeats } = get();
    return lockedSeats.some(
      (s) => s.seat_id === seatId && s.session_id === sessionId
    );
  },
}));
