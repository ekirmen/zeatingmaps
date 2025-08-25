import { create } from 'zustand';
import { supabase, supabaseAdmin } from '../supabaseClient';

function isValidUuid(value) {
  // Aceptar cualquier string no vacío, no solo UUIDs
  return typeof value === 'string' && value.trim() !== '';
}

function getStoredSessionId() {
  return localStorage.getItem('anonSessionId');
}

async function getAuthenticatedUserId() {
  try {
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return null;
    }
    
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user?.id || null;
  } catch (err) {
    console.error('[SEAT_LOCK] Error obteniendo sesión:', err.message);
    return null;
  }
}

async function getSessionId() {
  const userId = await getAuthenticatedUserId();
  if (userId) {
    localStorage.setItem('anonSessionId', userId);
    return userId;
  }
  const stored = getStoredSessionId();
  if (stored) return stored;
  const anonId = crypto.randomUUID();
  localStorage.setItem('anonSessionId', anonId);
  console.log('[SESSION] Nueva sesión anónima generada:', anonId);
  return anonId;
}

// Función para validar y convertir session_id a string
function normalizeSessionId(sessionId) {
  if (!sessionId) return null;
  return String(sessionId); // Convertir a string para evitar problemas de tipos
}

async function initializeSession() {
  const userId = await getAuthenticatedUserId();
  if (userId) {
    localStorage.setItem('anonSessionId', userId);
  } else if (!getStoredSessionId()) {
    const anonId = crypto.randomUUID();
    localStorage.setItem('anonSessionId', anonId);
    console.log('[SESSION] Nueva sesión anónima generada:', anonId);
  }
}

initializeSession();

export const useSeatLockStore = create((set, get) => ({
  lockedSeats: [],
  lockedTables: [], // Nuevo: para bloquear mesas completas
  channel: null,

  setLockedSeats: (seats) => {
    console.log('[SEAT_LOCK] setLockedSeats invocado:', seats);
    // Validar que seats sea un array
    const validSeats = Array.isArray(seats) ? seats : [];
    set({ lockedSeats: validSeats });
  },

  setLockedTables: (tables) => {
    console.log('[SEAT_LOCK] setLockedTables invocado:', tables);
    // Validar que tables sea un array
    const validTables = Array.isArray(tables) ? tables : [];
    set({ lockedTables: validTables });
  },

  subscribeToFunction: (funcionId) => {
    console.log('[SEAT_LOCK] Suscribiéndose a función:', funcionId);

    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido, cancelando suscripción.');
      get().unsubscribe();
      set({ lockedSeats: [], lockedTables: [] });
      return;
    }

    // Verificar que supabase esté disponible
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return;
    }

    const currentChannel = get().channel;
    const expectedTopic = `seat-locks-channel-${funcionId}`;
    
    // Si ya estamos suscritos al canal correcto, no hacer nada
    if (currentChannel && currentChannel.topic === expectedTopic) {
      console.log('[SEAT_LOCK] Ya suscrito a esta función:', expectedTopic);
      return;
    }

    // Limpiar suscripción anterior si existe
    if (currentChannel) {
      console.log('[SEAT_LOCK] Desuscribiendo canal anterior:', currentChannel.topic);
      try {
        currentChannel.unsubscribe();
      } catch (error) {
        console.warn('[SEAT_LOCK] Error al desuscribir canal anterior:', error);
      }
    }

    const fetchInitialLocks = async () => {
      console.log('[SEAT_LOCK] Cargando bloqueos iniciales para función:', funcionId);
      try {
        const { data, error } = await supabaseAdmin
          .from('seat_locks')
          .select('seat_id, table_id, session_id, locked_at, status, lock_type')
          .eq('funcion_id', funcionId);

        if (error) {
          console.error('[SEAT_LOCK] Error al obtener bloqueos iniciales:', error);
          set({ lockedSeats: [], lockedTables: [] });
        } else {
          console.log('[SEAT_LOCK] Bloqueos iniciales cargados:', data);
          console.log('📊 [SEAT_LOCK] Total de bloqueos encontrados:', data?.length || 0);
          // Validar que data sea un array
          const validData = Array.isArray(data) ? data : [];
          
          // Separar bloqueos de asientos y mesas
          const seatLocks = validData.filter(lock => lock.lock_type === 'seat' || !lock.lock_type);
          const tableLocks = validData.filter(lock => lock.lock_type === 'table');
          
          console.log('🪑 [SEAT_LOCK] Bloqueos de asientos:', seatLocks.length);
          console.log('🪑 [SEAT_LOCK] Bloqueos de mesas:', tableLocks.length);
          
          set({ 
            lockedSeats: seatLocks,
            lockedTables: tableLocks
          });
        }
      } catch (error) {
        console.error('[SEAT_LOCK] Error inesperado al cargar bloqueos iniciales:', error);
        set({ lockedSeats: [], lockedTables: [] });
      }
    };
    fetchInitialLocks();

    try {
      // Verificar si ya existe un canal con el mismo topic antes de crear uno nuevo
      const existingChannel = supabase.getChannels().find(ch => ch.topic === expectedTopic);
      if (existingChannel) {
        console.log('[SEAT_LOCK] Canal ya existe, reutilizando:', expectedTopic);
        set({ channel: existingChannel });
        return;
      }

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
                const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
                const currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
                
                const newLock = payload.new;
                
                if (newLock.lock_type === 'table') {
                  // Es un bloqueo de mesa
                  const updatedTables = [
                    ...currentTables.filter(lock => lock.table_id !== newLock.table_id),
                    newLock,
                  ];
                  return { lockedTables: updatedTables };
                } else {
                  // Es un bloqueo de asiento
                  const updatedSeats = [
                    ...currentSeats.filter(lock => lock.seat_id !== newLock.seat_id),
                    newLock,
                  ];
                  return { lockedSeats: updatedSeats };
                }
              });
            }
            if (payload.eventType === 'DELETE') {
              set((state) => {
                const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
                const currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
                
                if (payload.old.lock_type === 'table') {
                  // Es un desbloqueo de mesa
                  const updatedTables = currentTables.filter(lock => lock.table_id !== payload.old.table_id);
                  return { lockedTables: updatedTables };
                } else {
                  // Es un desbloqueo de asiento
                  const updatedSeats = currentSeats.filter(lock => lock.seat_id !== payload.old.seat_id);
                  return { lockedSeats: updatedSeats };
                }
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('[SEAT_LOCK] Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[SEAT_LOCK] Canal suscrito exitosamente:', expectedTopic);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[SEAT_LOCK] Error en el canal:', expectedTopic);
          }
        });

      console.log('[SEAT_LOCK] Canal suscrito:', newChannel.topic);
      set({ channel: newChannel });
    } catch (error) {
      console.error('[SEAT_LOCK] Error al suscribirse al canal:', error);
    }
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      console.log('[SEAT_LOCK] Desuscribiendo canal:', channel.topic);
      try {
        // Verificar si el canal aún existe antes de desuscribirse
        const existingChannels = supabase.getChannels();
        const channelExists = existingChannels.some(ch => ch.topic === channel.topic);
        
        if (channelExists) {
          channel.unsubscribe();
          console.log('[SEAT_LOCK] Canal desuscrito exitosamente:', channel.topic);
        } else {
          console.log('[SEAT_LOCK] Canal ya no existe, no es necesario desuscribirse:', channel.topic);
        }
      } catch (error) {
        console.warn('[SEAT_LOCK] Error al desuscribir canal:', error);
      }
      set({ channel: null, lockedSeats: [], lockedTables: [] });
    } else {
      console.log('[SEAT_LOCK] No hay canal activo para desuscribir');
    }
  },

  // Bloquear asiento individual
  lockSeat: async (seatId, status = 'seleccionado', overrideFuncionId = null) => {
    console.log('🚀 [SEAT_LOCK] Iniciando proceso de bloqueo para asiento:', seatId);
    
    // Verificar que supabase esté disponible
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return false;
    }

    const topic = get().channel?.topic;
    const sessionId = normalizeSessionId(await getSessionId());

    const funcionId = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    // Validar que funcionId sea un número válido
    const funcionIdNum = parseInt(funcionId);
    if (isNaN(funcionIdNum) || funcionIdNum <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionId);
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    // Validar que seatId sea un string válido (no necesariamente UUID)
    if (!seatId || typeof seatId !== 'string' || seatId.trim() === '') {
      console.warn('[SEAT_LOCK] seat_id inválido', seatId);
      return false;
    }

    const lockedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log('[SEAT_LOCK] Intentando bloquear asiento:', {
      seat_id: seatId,
      funcion_id: funcionIdNum,
      session_id: sessionId,
      status,
      lock_type: 'seat'
    });

    try {
      const { error } = await supabaseAdmin
        .from('seat_locks')
        .upsert({
          seat_id: seatId,
          funcion_id: funcionIdNum,
          session_id: sessionId,
          locked_at: lockedAt,
          expires_at: expiresAt,
          status,
          lock_type: 'seat',
        });

      if (error) {
        console.error('[SEAT_LOCK] Error al bloquear asiento:', error);
        return false;
      }

      console.log('💾 [SEAT_LOCK] Asiento guardado exitosamente en la base de datos');

      // Actualización local inmediata
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        console.log('📊 [SEAT_LOCK] Estado local ANTES del cambio:', currentSeats);
        
        const newLockedSeats = [
          ...currentSeats.filter((s) => s.seat_id !== seatId),
          {
            seat_id: seatId,
            funcion_id: funcionIdNum,
            session_id: sessionId,
            locked_at: lockedAt,
            expires_at: expiresAt,
            status,
            lock_type: 'seat',
          },
        ];
        console.log('🔒 [SEAT_LOCK] Estado local DESPUÉS del cambio:', newLockedSeats);
        return {
          lockedSeats: newLockedSeats,
        };
      });

      console.log('✅ Asiento bloqueado exitosamente en DB y estado local');
      return true;
    } catch (error) {
      console.error('[SEAT_LOCK] Error inesperado al bloquear asiento:', error);
      return false;
    }
  },

  // Bloquear mesa completa
  lockTable: async (tableId, status = 'seleccionado', overrideFuncionId = null) => {
    // Verificar que supabase esté disponible
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return false;
    }

    const topic = get().channel?.topic;
    const sessionId = normalizeSessionId(await getSessionId());

    const funcionId = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    // Validar que funcionId sea un número válido
    const funcionIdNum = parseInt(funcionId);
    if (isNaN(funcionIdNum) || funcionIdNum <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionId);
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    // Validar que tableId sea un string válido (no necesariamente UUID)
    if (!tableId || typeof tableId !== 'string' || tableId.trim() === '') {
      console.warn('[SEAT_LOCK] table_id inválido', tableId);
      return false;
    }

    const lockedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log('[SEAT_LOCK] Intentando bloquear mesa:', {
      table_id: tableId,
      funcion_id: funcionIdNum,
      session_id: sessionId,
      status,
      lock_type: 'table'
    });

    try {
      const { error } = await supabaseAdmin
        .from('seat_locks')
        .upsert({
          table_id: tableId,
          funcion_id: funcionIdNum,
          session_id: sessionId,
          locked_at: lockedAt,
          expires_at: expiresAt,
          status,
          lock_type: 'table',
        });

      if (error) {
        console.error('[SEAT_LOCK] Error al bloquear mesa:', error);
        return false;
      }

      // Actualización local inmediata
      set((state) => {
        const currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
        return {
          lockedTables: [
            ...currentTables.filter((t) => t.table_id !== tableId),
            {
              table_id: tableId,
              funcion_id: funcionIdNum,
              session_id: sessionId,
              locked_at: lockedAt,
              expires_at: expiresAt,
              status,
              lock_type: 'table',
            },
          ],
        };
      });

      return true;
    } catch (error) {
      console.error('[SEAT_LOCK] Error inesperado al bloquear mesa:', error);
      return false;
    }
  },

  // Desbloquear asiento individual
  unlockSeat: async (seatId, overrideFuncionId = null) => {
    console.log('🚀 [SEAT_LOCK] Iniciando proceso de desbloqueo para asiento:', seatId);
    
    // Verificar que supabase esté disponible
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return false;
    }

    const topic = get().channel?.topic;
    const sessionId = normalizeSessionId(await getSessionId());

    const funcionId = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    // Validar que funcionId sea un número válido
    const funcionIdNum = parseInt(funcionId);
    if (isNaN(funcionIdNum) || funcionIdNum <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionId);
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    // Validar que seatId sea un string válido (no necesariamente UUID)
    if (!seatId || typeof seatId !== 'string' || seatId.trim() === '') {
      console.warn('[SEAT_LOCK] seat_id inválido', seatId);
      return false;
    }
  
    const currentSeats = Array.isArray(get().lockedSeats) ? get().lockedSeats : [];
    const currentLock = currentSeats.find(
      s => s.seat_id === seatId && s.session_id === sessionId
    );
    if (currentLock?.status === 'pagado' || currentLock?.status === 'reservado') {
      console.warn('[SEAT_LOCK] No se puede desbloquear un asiento pagado o reservado');
      return false;
    }

    console.log('[SEAT_LOCK] Intentando desbloquear asiento:', {
      seat_id: seatId,
      funcion_id: funcionIdNum,
      session_id: sessionId
    });

    try {
      const { error } = await supabaseAdmin
        .from('seat_locks')
        .delete()
        .eq('seat_id', seatId)
        .eq('funcion_id', funcionIdNum)
        .eq('session_id', sessionId)
        .eq('lock_type', 'seat');
    
      if (error) {
        console.error('[SEAT_LOCK] Error al desbloquear asiento:', error);
        return false;
      }

      console.log('💾 [SEAT_LOCK] Asiento eliminado exitosamente de la base de datos');
    
      // Actualización local inmediata
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        console.log('📊 [SEAT_LOCK] Estado local ANTES del desbloqueo:', currentSeats);
        
        const updatedSeats = currentSeats.filter((s) => s.seat_id !== seatId);
        console.log('🔓 [SEAT_LOCK] Estado local DESPUÉS del desbloqueo:', updatedSeats);
        return {
          lockedSeats: updatedSeats,
        };
      });
    
      console.log('✅ Asiento desbloqueado exitosamente en DB y estado local');
      return true;
    } catch (error) {
      console.error('[SEAT_LOCK] Error inesperado al desbloquear asiento:', error);
      return false;
    }
  },

  // Desbloquear mesa completa
  unlockTable: async (tableId, overrideFuncionId = null) => {
    // Verificar que supabase esté disponible
    if (!supabase) {
      console.error('[SEAT_LOCK] Cliente Supabase no disponible');
      return false;
    }

    const topic = get().channel?.topic;
    const sessionId = normalizeSessionId(await getSessionId());

    const funcionId = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionId) {
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }

    // Validar que funcionId sea un número válido
    const funcionIdNum = parseInt(funcionId);
    if (isNaN(funcionIdNum) || funcionIdNum <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionId);
      return false;
    }

    if (!isValidUuid(sessionId)) {
      console.warn('[SEAT_LOCK] session_id inválido', sessionId);
      return false;
    }

    // Validar que tableId sea un string válido (no necesariamente UUID)
    if (!tableId || typeof tableId !== 'string' || tableId.trim() === '') {
      console.warn('[SEAT_LOCK] table_id inválido', tableId);
      return false;
    }
  
    const currentTables = Array.isArray(get().lockedTables) ? get().lockedTables : [];
    const currentLock = currentTables.find(
      t => t.table_id === tableId && t.session_id === sessionId
    );
    if (currentLock?.status === 'pagado' || currentLock?.status === 'reservado') {
      console.warn('[SEAT_LOCK] No se puede desbloquear una mesa pagada o reservada');
      return false;
    }

    console.log('[SEAT_LOCK] Intentando desbloquear mesa:', {
      table_id: tableId,
      funcion_id: funcionIdNum,
      session_id: sessionId
    });

    try {
      const { error } = await supabaseAdmin
        .from('seat_locks')
        .delete()
        .eq('table_id', tableId)
        .eq('funcion_id', funcionIdNum)
        .eq('session_id', sessionId)
        .eq('lock_type', 'table');
    
      if (error) {
        console.error('[SEAT_LOCK] Error al desbloquear mesa:', error);
        return false;
      }
    
      // Actualización local inmediata
      set((state) => {
        const currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
        const updatedTables = currentTables.filter((t) => t.table_id !== tableId);
        console.log('[SEAT_LOCK] Mesa desbloqueada localmente:', tableId, 'Mesas restantes:', updatedTables.length);
        return {
          lockedTables: updatedTables,
        };
      });
    
      return true;
    } catch (error) {
      console.error('[SEAT_LOCK] Error inesperado al desbloquear mesa:', error);
      return false;
    }
  },

  // Verificar si un asiento está bloqueado
  isSeatLocked: (seatId) => {
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
    return seats.some((s) => s.seat_id === seatId);
  },

  // Verificar si un asiento está bloqueado por el usuario actual
  isSeatLockedByMe: (seatId) => {
    const sessionId = normalizeSessionId(getStoredSessionId());
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
    return seats.some(
      (s) => s.seat_id === seatId && s.session_id === sessionId
    );
  },

  // Verificar si una mesa está bloqueada
  isTableLocked: (tableId) => {
    const { lockedTables } = get();
    const tables = Array.isArray(lockedTables) ? lockedTables : [];
    return tables.some((t) => t.table_id === tableId);
  },

  // Verificar si una mesa está bloqueada por el usuario actual
  isTableLockedByMe: (tableId) => {
    const sessionId = normalizeSessionId(getStoredSessionId());
    const { lockedTables } = get();
    const tables = Array.isArray(lockedTables) ? lockedTables : [];
    return tables.some(
      (t) => t.table_id === tableId && t.session_id === sessionId
    );
  },

  // Verificar si cualquier asiento de una mesa está bloqueado
  isAnySeatInTableLocked: (tableId, allSeats) => {
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
    
    // Obtener todos los asientos que pertenecen a esta mesa
    const tableSeats = allSeats.filter(seat => seat.parentId === tableId);
    
    // Verificar si alguno de los asientos de la mesa está bloqueado
    return tableSeats.some(seat => seats.some(lock => lock.seat_id === seat._id));
  },

  // Verificar si todos los asientos de una mesa están bloqueados por el usuario actual
  areAllSeatsInTableLockedByMe: (tableId, allSeats) => {
    const sessionId = normalizeSessionId(getStoredSessionId());
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
    
    // Obtener todos los asientos que pertenecen a esta mesa
    const tableSeats = allSeats.filter(seat => seat.parentId === tableId);
    
    // Verificar si todos los asientos de la mesa están bloqueados por el usuario actual
    return tableSeats.length > 0 && tableSeats.every(seat => 
      seats.some(lock => lock.seat_id === seat._id && lock.session_id === sessionId)
    );
  },
}));
