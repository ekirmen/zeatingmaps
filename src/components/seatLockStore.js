import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import atomicSeatLockService from '../services/atomicSeatLock';

const buildTableSeatId = (tableId) => `table:${tableId}`;

const ensureSeatIdWithPrefix = (seatId) => {
  if (!seatId) return seatId;
  const idString = seatId.toString();
  if (idString.startsWith('table:')) {
    return idString;
  }
  return idString.startsWith('silla_') ? idString : `silla_${idString}`;
};

// Función helper para obtener el tenant_id actual
const getCurrentTenantId = () => {
  try {
    // Intentar obtener el tenant del localStorage (si se guardó previamente)
    const tenantId = localStorage.getItem('currentTenantId');
    if (tenantId) {
      return tenantId;
    }

    // Si no hay tenant en localStorage, intentar obtenerlo del contexto global
    if (typeof window !== 'undefined' && window.__TENANT_CONTEXT__) {
      const globalTenantId = window.__TENANT_CONTEXT__.getTenantId?.();
      if (globalTenantId) {
        return globalTenantId;
      }
    }

    // Si no se puede obtener el tenant, mostrar advertencia
    return null;
  } catch (error) {
    return null;
  }
};

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
  if (stored) {
    return stored;
  }
  const anonId = crypto.randomUUID();
  localStorage.setItem('anonSessionId', anonId);
  return anonId;
}

// Función para validar y convertir session_id a string
function normalizeSessionId(sessionId) {
  if (!sessionId) return null;

  // Convertir a string y limpiar
  let value = String(sessionId);

  // Limpiar caracteres invisibles y espacios
  value = value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar caracteres invisibles
    .replace(/^["']|["']$/g, ''); // Eliminar comillas

  // Validar formato UUID básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    // Si no es válido, generar uno nuevo
    const newUuid = crypto?.randomUUID?.() || generateUuidFallback();
    localStorage.setItem('anonSessionId', newUuid);
    return newUuid;
  }

  return value;
}

// Función auxiliar para generar UUID si crypto.randomUUID no está disponible
function generateUuidFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function initializeSession() {
  const userId = await getAuthenticatedUserId();
  if (userId) {
    localStorage.setItem('anonSessionId', userId);
  } else if (!getStoredSessionId()) {
    const anonId = crypto.randomUUID();
    localStorage.setItem('anonSessionId', anonId);
  }
}

initializeSession();

// Función para obtener configuraciones de tiempo
function readMinutesConfig(key, fallback, min = 1, max = 120) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    if (!window.localStorage) {
      return fallback;
    }

    const stored = window.localStorage.getItem(key);
    if (stored == null || stored === '') {
      return fallback;
    }

    const parsed = parseInt(stored, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, parsed));
  } catch (error) {
    return fallback;
  }
}

function getSeatSettings() {
  const lockExpirationMinutes = readMinutesConfig('cart_lock_minutes', 15);
  const mobileLockExpirationMinutes = readMinutesConfig('cart_lock_minutes_mobile', lockExpirationMinutes);
  const preserveTimeMinutes = readMinutesConfig('seat_preserve_time', 5, 1, 30);
  const warningTimeMinutes = readMinutesConfig('seat_warning_time', 3, 1, 30);

  let enableAutoCleanup = true;
  let enableRestoration = true;

  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage) {
        enableAutoCleanup = window.localStorage.getItem('seat_auto_cleanup') !== 'false';
        enableRestoration = window.localStorage.getItem('seat_restoration') !== 'false';
      }
    } catch (error) {
    }
  }

  return {
    lockExpirationMinutes,
    mobileLockExpirationMinutes,
    preserveTimeMinutes,
    warningTimeMinutes,
    enableAutoCleanup,
    enableRestoration
  };
}


// Función para limpiar bloqueos de una sesión específica (solo si han pasado más del tiempo de preservación)
async function cleanupSessionLocks(sessionId) {
  try {
    const settings = getSeatSettings();
    const now = new Date();
    const preserveTimeAgo = new Date(now.getTime() - settings.preserveTimeMinutes * 60 * 1000);

    // Solo limpiar si han pasado más del tiempo de preservación desde el último bloqueo
    const { data: recentLocks, error: checkError } = await supabase
      .from('seat_locks')
      .select('locked_at')
      .eq('session_id', sessionId)
      .gte('locked_at', preserveTimeAgo.toISOString())
      .neq('status', 'pagado');

    if (checkError) {
      console.error('❌ [CLEANUP] Error verificando bloqueos recientes:', checkError);
      return;
    }

    // Si hay bloqueos recientes (< tiempo de preservación), no limpiar
    if (recentLocks && recentLocks.length > 0) {
      console.log(`⏰ [CLEANUP] Bloqueos recientes encontrados (últimos ${settings.preserveTimeMinutes} min), preservando...`);
      return;
    }

    // Si no hay bloqueos recientes, limpiar todos los de esta sesión
    const { data, error } = await supabase
      .from('seat_locks')
      .delete()
      .eq('session_id', sessionId)
      .neq('status', 'pagado');

    if (error) {
      console.error('❌ [CLEANUP] Error limpiando bloqueos de sesión:', error);
    } else {
    }
  } catch (error) {
    console.error('❌ [CLEANUP] Error inesperado limpiando sesión:', error);
  }
}

// Función para restaurar bloqueos de una sesión (cuando el usuario regresa)
async function restoreSessionLocks(sessionId) {
  try {
    const settings = getSeatSettings();
    if (!settings.enableRestoration) {
      return;
    }

    // Restaurar bloqueos que estaban "expirando"
    const { data, error } = await supabase
      .from('seat_locks')
      .update({ status: 'seleccionado' })
      .eq('session_id', sessionId)
      .eq('status', 'expirando');

    if (error) {
      console.error('❌ [CLEANUP] Error restaurando bloqueos:', error);
    } else {
    }
  } catch (error) {
    console.error('❌ [CLEANUP] Error inesperado restaurando bloqueos:', error);
  }
}

// Contador de referencias para canales Realtime (fuera del store para evitar problemas de estado)
const channelRefCounts = new Map(); // topic -> count

export const useSeatLockStore = create((set, get) => ({
  lockedSeats: [],
  lockedTables: [], // Nuevo: para bloquear mesas completas
  channel: null,
  cleanupInterval: null, // Intervalo para limpieza automática
  mapa: null, // Mapa original (no se actualiza)
  seatStates: new Map(), // Estados actualizados de asientos individuales
  seatStatesVersion: 0, // Contador de versión para detectar cambios en seatStates
  subscriptionRefCount: 0, // Contador de referencias de suscripción
  connectivityListenersAttached: false,
  connectivityCleanup: null,
  connectionIssueDetected: false,
  pendingReloadTimeout: null,
  lastFuncionId: null,

  setLockedSeats: (seats) => {
    // Validar que seats sea un array
    const validSeats = Array.isArray(seats) ? seats : [];
    set({ lockedSeats: validSeats });
  },

  // Helper centralizado para validar/generar session_id y mantenerlo sincronizado
  getValidSessionId: async () => {
    const rawSessionId = await getSessionId();
    const normalized = normalizeSessionId(rawSessionId);
    if (normalized && normalized !== rawSessionId) {
      localStorage.setItem('anonSessionId', normalized);
    }
    return normalized;
  },

  setMapa: (mapa) => {
    set({ mapa });
  },

  // Actualizar estado de un asiento individual sin tocar el mapa completo
  // Optimizado: usa requestAnimationFrame para mejor performance
  updateSeatState: (seatId, newState) => {
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        set((state) => {
          const newSeatStates = new Map(state.seatStates);
          newSeatStates.set(seatId, newState);
          return { seatStates: newSeatStates, seatStatesVersion: state.seatStatesVersion + 1 };
        });
      });
    } else {
      set((state) => {
        const newSeatStates = new Map(state.seatStates);
        newSeatStates.set(seatId, newState);
        return { seatStates: newSeatStates, seatStatesVersion: state.seatStatesVersion + 1 };
      });
    }
  },

  // Función específica para actualizar seatStates desde el exterior
  setSeatStates: (newSeatStates) => {
    set((state) => ({
      seatStates: newSeatStates,
      seatStatesVersion: state.seatStatesVersion + 1
    }));
  },

  // Obtener estado de un asiento
  getSeatState: (seatId) => {
    const state = get();
    return state.seatStates.get(seatId);
  },

  // Función para limpiar manualmente el estado de un asiento (útil para debugging)
  clearSeatState: (seatId) => {
    set((state) => {
      const newSeatStates = new Map(state.seatStates);
      newSeatStates.delete(seatId);
      return { seatStates: newSeatStates, seatStatesVersion: state.seatStatesVersion + 1 };
    });
  },

  // Función para limpiar todos los estados de asientos (útil para debugging)
  clearAllSeatStates: () => {
    set((state) => {
      return { seatStates: new Map() };
    });
  },

  // Marcar asientos como visibles para priorizar updates
  setVisibleSeats: (seatIds) => {
    if (typeof window !== 'undefined') {
      if (!window.__VISIBLE_SEATS__) {
        window.__VISIBLE_SEATS__ = new Set();
      }
      window.__VISIBLE_SEATS__.clear();
      seatIds.forEach(id => window.__VISIBLE_SEATS__.add(String(id)));
    }
  },

  // Marcar asientos como de alta prioridad (seleccionados, en carrito)
  setPrioritySeats: (seatIds) => {
    if (typeof window !== 'undefined') {
      if (!window.__PRIORITY_SEATS__) {
        window.__PRIORITY_SEATS__ = new Set();
      }
      window.__PRIORITY_SEATS__.clear();
      seatIds.forEach(id => window.__PRIORITY_SEATS__.add(String(id)));
    }
  },

  ensureConnectivityListeners: (funcionId = null) => {
    if (typeof window === 'undefined') {
      return;
    }

    const state = get();
    if (state.connectivityListenersAttached) {
      // Solo actualizar el último funcionId observado
      set({ lastFuncionId: funcionId || state.lastFuncionId });
      return;
    }

    const handleOffline = () => {
      set({ connectionIssueDetected: true });
    };

    const handleOnline = () => {
      if (get().connectionIssueDetected) {
        get().schedulePageReload('online');
      }
    };

    const handleWindowFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden && get().connectionIssueDetected) {
        get().schedulePageReload('focus');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleWindowFocus);

    const cleanup = () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleWindowFocus);
    };

    set({
      connectivityListenersAttached: true,
      connectivityCleanup: cleanup,
      lastFuncionId: funcionId,
    });
  },

  teardownConnectivityListeners: () => {
    const state = get();
    if (state.connectivityCleanup) {
      try {
        state.connectivityCleanup();
      } catch (error) {
      }
    }

    if (typeof window !== 'undefined' && state.pendingReloadTimeout) {
      window.clearTimeout(state.pendingReloadTimeout);
    }

    set({
      connectivityListenersAttached: false,
      connectivityCleanup: null,
      connectionIssueDetected: false,
      pendingReloadTimeout: null,
      lastFuncionId: null,
    });
  },

  schedulePageReload: (reason = 'unknown') => {
    if (typeof window === 'undefined') {
      return;
    }

    const { pendingReloadTimeout } = get();
    if (pendingReloadTimeout) {
      return;
    }

    // Check for reload loop
    try {
      const lastReload = sessionStorage.getItem('last_seat_lock_reload');
      const reloadCount = parseInt(sessionStorage.getItem('seat_lock_reload_count') || '0');
      const now = Date.now();

      if (lastReload && (now - parseInt(lastReload) < 10000)) {
        if (reloadCount > 3) {
          console.error('🛑 [SEAT_LOCK_STORE] Deteniendo bucle de recarga. Por favor verifique su conexión.');
          return;
        }
        sessionStorage.setItem('seat_lock_reload_count', (reloadCount + 1).toString());
      } else {
        sessionStorage.setItem('seat_lock_reload_count', '1');
      }
      sessionStorage.setItem('last_seat_lock_reload', now.toString());
    } catch (e) {
      // Ignore storage errors
    }

    console.warn(`🔄 [SEAT_LOCK_STORE] Recarga solicitada (motivo: ${reason}) - Bloqueada para evitar bucles`);
    // window.setTimeout(() => {
    //   try {
    //     window.location.reload();
    //   } catch (error) {
    //     console.error('❌ [SEAT_LOCK_STORE] Error al intentar recargar la página:', error);
    //   }
    // }, 2000); 

    // Solo limpiar el timeout pendiente
    set({ pendingReloadTimeout: null });
  },

  handleRealtimeChannelIssue: (reason, funcionId = null) => {
    set({
      connectionIssueDetected: true,
      lastFuncionId: funcionId || get().lastFuncionId,
    });

    // Intentar recargar inmediatamente para forzar la reconexión
    get().schedulePageReload(reason || 'channel_issue');
  },

  setLockedTables: (tables) => {
    // Validar que tables sea un array
    const validTables = Array.isArray(tables) ? tables : [];
    set({ lockedTables: validTables });
  },

  // Función para iniciar limpieza automática mejorada
  startAutoCleanup: (intervalMinutes = 5) => {
    // Limpiar bloqueos abandonados con intervalo configurable
    const interval = setInterval(async () => {
      try {
        // Usar servicio atómico para limpieza
        const result = await atomicSeatLockService.cleanupExpiredLocks();
        if (result.success) {
        } else {
          console.error('❌ [CLEANUP] Error en limpieza automática:', result.error);
        }
      } catch (error) {
        console.error('❌ [CLEANUP] Error inesperado en limpieza automática:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Limpiar bloqueos de la sesión actual al salir
    const handleBeforeUnload = async (event) => {
      const sessionId = await getSessionId();
      if (sessionId) {
        try {
          await cleanupSessionLocks(sessionId);
        } catch (error) {
          console.error('❌ [CLEANUP] Error limpiando al salir:', error);
        }
      }
    };

    // Limpiar bloqueos de la sesión actual al cambiar de página
    const handlePageHide = async () => {
      const sessionId = await getSessionId();
      if (sessionId) {
        try {
          await cleanupSessionLocks(sessionId);
        } catch (error) {
          console.error('❌ [CLEANUP] Error limpiando al cambiar página:', error);
        }
      }
    };

    // Limpiar bloqueos cuando la página pierde el foco
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const sessionId = await getSessionId();
        if (sessionId) {
          try {
            await cleanupSessionLocks(sessionId);
          } catch (error) {
            console.error('❌ [CLEANUP] Error limpiando al perder foco:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    set({ cleanupInterval: interval });

    // Retornar función para limpiar los event listeners
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  },

  // Función para detener limpieza automática
  stopAutoCleanup: () => {
    const { cleanupInterval } = get();
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      set({ cleanupInterval: null });
    }
  },

  // Función para limpiar bloqueos de la sesión actual
  cleanupCurrentSession: async () => {
    const sessionId = await getSessionId();
    if (sessionId) {
      await cleanupSessionLocks(sessionId);
    }
  },

  // Función para restaurar bloqueos de la sesión actual
  restoreCurrentSession: async () => {
    const sessionId = await getSessionId();
    if (sessionId) {
      await restoreSessionLocks(sessionId);
    }
  },

  subscribeToFunction: (funcionId) => {
    if (!funcionId) {
      get().unsubscribe();
      set({ lockedSeats: [], lockedTables: [] });
      return;
    }

    // Verificar que supabase esté disponible
    if (!supabase) {
      return;
    }

    const normalizedFuncionId = String(funcionId);
    const expectedTopic = `seat-locks-channel-${normalizedFuncionId}`;

    // Verificar si ya existe un canal activo para este topic
    const channels = supabase.getChannels();
    const existingChannel = Array.isArray(channels) ? channels.find(ch => ch.topic === expectedTopic) : null;

    if (existingChannel) {
      // Verificar que el canal esté activo (joined o joining)
      const channelState = existingChannel.state;
      if (channelState === 'joined' || channelState === 'joining') {
        // Incrementar contador de referencias
        const currentCount = channelRefCounts.get(expectedTopic) || 0;
        channelRefCounts.set(expectedTopic, currentCount + 1);
        set({ channel: existingChannel, subscriptionRefCount: currentCount + 1 });
        return;
      } else {
        // Limpiar el canal inactivo
        try {
          existingChannel.unsubscribe();
        } catch (e) {
          // Ignorar errores
        }
      }
    }

    // Limpiar suscripción anterior si existe (canal diferente)
    const currentChannel = get().channel;
    if (currentChannel && currentChannel.topic !== expectedTopic) {
      try {
        currentChannel.unsubscribe();
      } catch (error) {
        // Error silencioso
      }
    }

    const fetchInitialLocks = async () => {
      try {
        const tenantId = getCurrentTenantId();
        let seatLocksData = [];
        let seatLocksError = null;
        let paymentData = [];
        let paymentError = null;

        try {
          // Optimización: Usar tenant_id si está disponible para consulta más rápida
          const tenantId = getCurrentTenantId();
          let query = supabase
            .from('seat_locks')
            .select('seat_id, table_id, session_id, locked_at, status, lock_type, user_id, metadata')
            .eq('funcion_id', normalizedFuncionId);

          // Si hay tenant_id, filtrar por él para consulta más rápida
          if (tenantId) {
            query = query.eq('tenant_id', tenantId);
          }

          // Limitar a bloqueos activos para reducir datos transferidos
          query = query.in('status', ['seleccionado', 'reservado', 'locked', 'expirando', 'vendido']);

          const { data, error } = await query;

          seatLocksData = Array.isArray(data) ? data : [];
          seatLocksError = error || null;

          if (seatLocksError) {
            console.error('❌ [SEAT_LOCK_STORE] Error cargando seat_locks:', seatLocksError);
          }
        } catch (error) {
          seatLocksError = error;
          console.error('❌ [SEAT_LOCK_STORE] Error inesperado cargando seat_locks:', error);
        }

        try {
          const { data, error } = await supabase
            .from('payment_transactions')
            .select('seats, user_id, status')
            .eq('funcion_id', normalizedFuncionId)
            .eq('status', 'completed');

          paymentData = Array.isArray(data) ? data : [];
          paymentError = error || null;

          if (paymentError) {
            console.error('❌ [SEAT_LOCK_STORE] Error cargando payment_transactions:', paymentError);
          }
        } catch (error) {
          paymentError = error;
          console.error('❌ [SEAT_LOCK_STORE] Error inesperado cargando payment_transactions:', error);
        }

        const shouldUseFallback =
          seatLocksError ||
          paymentError ||
          (tenantId && (!Array.isArray(seatLocksData) || seatLocksData.length === 0) && (!Array.isArray(paymentData) || paymentData.length === 0));

        if (shouldUseFallback) {
          try {
            const params = new URLSearchParams({ funcionId: String(normalizedFuncionId) });
            if (tenantId) {
              params.set('tenantId', tenantId);
            }

            const response = await fetch(`/api/seat-locks/status?${params.toString()}`);
            if (response.ok) {
              const payload = await response.json();
              seatLocksData = Array.isArray(payload.lockedSeats) ? payload.lockedSeats : [];
              paymentData = Array.isArray(payload.transactions) ? payload.transactions : [];
            } else {
              console.error('❌ [SEAT_LOCK_STORE] Fallback seat-locks API error:', await response.text());
            }
          } catch (fallbackError) {
            console.error('❌ [SEAT_LOCK_STORE] Error en fallback de seat-locks API:', fallbackError);
          }
        }

        // Datos cargados

        // 3. Procesar seat_locks
        const validSeatLocksData = Array.isArray(seatLocksData) ? seatLocksData : [];
        const seatLocks = validSeatLocksData.filter(lock => lock.lock_type === 'seat' || !lock.lock_type);
        const tableLocks = validSeatLocksData.filter(lock => lock.lock_type === 'table');

        // 4. Procesar payment_transactions
        const soldSeats = new Map();
        if (Array.isArray(paymentData)) {
          paymentData.forEach(payment => {
            try {
              const seats = typeof payment.seats === 'string' ? JSON.parse(payment.seats) : payment.seats;
              if (Array.isArray(seats)) {
                seats.forEach(seat => {
                  const seatId = seat.sillaId || seat.id || seat._id;
                  if (seatId) {
                    soldSeats.set(seatId, {
                      status: 'vendido',
                      user_id: payment.user_id,
                      payment_status: payment.status
                    });
                  }
                });
              }
            } catch (error) {
              console.error('❌ [SEAT_LOCK_STORE] Error parseando seats:', error);
            }
          });
        }

        // 5. Crear el mapa de estados de asientos
        const newSeatStates = new Map();
        const currentSessionIdRaw = localStorage.getItem('anonSessionId') || 'unknown';
        const currentSessionId = normalizeSessionId(currentSessionIdRaw);

        // Procesar asientos de seat_locks
        seatLocks.forEach(lock => {
          // Normalizar seat_id para que coincida con el formato usado en el componente
          let normalizedSeatId = lock.seat_id;
          if (normalizedSeatId && !normalizedSeatId.startsWith('silla_')) {
            normalizedSeatId = `silla_${normalizedSeatId}`;
          }

          let visualState = 'seleccionado_por_otro'; // Estado por defecto

          if (lock.status === 'pagado' || lock.status === 'vendido') {
            visualState = 'vendido';
          } else if (lock.status === 'reservado') {
            visualState = 'reservado';
          } else if (lock.status === 'locked') {
            visualState = 'locked';
          } else if (lock.status === 'seleccionado') {
            // Verificar si es del usuario actual - normalizar session_id para comparar
            const lockSessionId = normalizeSessionId(lock.session_id?.toString() || '');
            if (currentSessionId && lockSessionId && currentSessionId === lockSessionId) {
              visualState = 'seleccionado';
            } else {
              visualState = 'seleccionado_por_otro';
            }
          }

          // Usar el seat_id normalizado para el Map
          newSeatStates.set(normalizedSeatId, visualState);
          // Actualizar también el lock con el seat_id normalizado
          lock.seat_id = normalizedSeatId;
        });

        // Procesar asientos vendidos de payment_transactions
        // PRIORIDAD: payment_transactions tiene precedencia sobre seat_locks
        soldSeats.forEach((seatInfo, seatId) => {
          // SIEMPRE establecer como 'vendido' si está en payment_transactions, sin importar seat_locks
          newSeatStates.set(seatId, 'vendido');
          // Estado inicial del asiento (payment_transactions - PRIORIDAD)
        });

        set((state) => ({
          lockedSeats: seatLocks,
          lockedTables: tableLocks,
          seatStates: newSeatStates,
          seatStatesVersion: state.seatStatesVersion + 1
        }));
      } catch (error) {
        console.error('❌ [SEAT_LOCK_STORE] Error en fetchInitialLocks:', error);
        set({ lockedSeats: [], lockedTables: [] });
      }
    };
    fetchInitialLocks();
    get().ensureConnectivityListeners(normalizedFuncionId);

    try {
      // Verificar si ya existe un canal con el mismo topic antes de crear uno nuevo
      const channels = supabase.getChannels();
      const existingChannel = Array.isArray(channels) ? channels.find(ch => ch.topic === expectedTopic) : null;
      if (existingChannel) {
        // Verificar que el canal esté activo (joined o joining)
        const channelState = existingChannel.state;
        if (channelState === 'joined' || channelState === 'joining') {
          set({ channel: existingChannel });
          return;
        } else {
          // Limpiar el canal inactivo
          try {
            existingChannel.unsubscribe();
          } catch (e) {
            // Ignorar errores
          }
        }
      }

      // Desuscribirse de canales anteriores si existen
      if (channels && channels.length > 0) {
        channels.forEach(ch => {
          if (ch.topic !== expectedTopic) {
            try {
              ch.unsubscribe();
            } catch (e) {
              // Ignorar errores al desuscribirse
            }
          }
        });
      }

      // Obtener tenant_id para filtrar y mejorar performance
      const tenantId = getCurrentTenantId();

      // Crear filtro optimizado - Supabase Realtime usa comas para múltiples condiciones
      // Formato: "campo1=eq.valor1,campo2=eq.valor2"
      let filter = `funcion_id=eq.${normalizedFuncionId}`;
      if (tenantId) {
        filter = `${filter},tenant_id=eq.${tenantId}`;
      }
      const pendingUpdates = new Map();
      let debounceTimer = null;
      // Optimizado: 100ms para mejor balance entre performance y UX
      // Reducido de 150ms para mejor responsividad
      const DEBOUNCE_DELAY = 100;

      // Set para trackear asientos visibles (se actualiza desde componentes)
      const getVisibleSeats = () => {
        if (typeof window !== 'undefined' && window.__VISIBLE_SEATS__) {
          return window.__VISIBLE_SEATS__;
        }
        return new Set();
      };

      const getPrioritySeats = () => {
        if (typeof window !== 'undefined' && window.__PRIORITY_SEATS__) {
          return window.__PRIORITY_SEATS__;
        }
        return new Set();
      };

      const processPendingUpdates = () => {
        if (pendingUpdates.size === 0) {
          return;
        }

        const updatesToProcess = Array.from(pendingUpdates.values());
        pendingUpdates.clear();

        // Separar updates por prioridad (visibles/seleccionados primero)
        const visibleSeats = getVisibleSeats();
        const prioritySeats = getPrioritySeats();

        const priorityUpdates = updatesToProcess.filter(update =>
          visibleSeats.has(update.normalizedSeatId) ||
          prioritySeats.has(update.normalizedSeatId)
        );
        const normalUpdates = updatesToProcess.filter(update =>
          !visibleSeats.has(update.normalizedSeatId) &&
          !prioritySeats.has(update.normalizedSeatId)
        );

        // Procesar updates prioritarios primero (sincrónicamente)
        const processUpdates = (updates) => {
          set((state) => {
            let currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
            let currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
            const newSeatStates = new Map(state.seatStates);

            updates.forEach(({ eventType, lock, normalizedSeatId }) => {
              if (eventType === 'DELETE') {
                if (lock.lock_type === 'table') {
                  currentTables = currentTables.filter(l => l.table_id !== lock.table_id);
                } else {
                  currentSeats = currentSeats.filter(l => l.seat_id !== normalizedSeatId);
                  newSeatStates.delete(normalizedSeatId);
                }
              } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
                if (lock.lock_type === 'table') {
                  currentTables = [
                    ...currentTables.filter(l => l.table_id !== lock.table_id),
                    lock,
                  ];
                } else {
                  currentSeats = [
                    ...currentSeats.filter(l => l.seat_id !== normalizedSeatId),
                    { ...lock, seat_id: normalizedSeatId },
                  ];

                  let visualState = 'seleccionado_por_otro';

                  if (lock.status === 'pagado' || lock.status === 'vendido') {
                    visualState = 'vendido';
                  } else if (lock.status === 'reservado') {
                    visualState = 'reservado';
                  } else if (lock.status === 'locked') {
                    visualState = 'locked';
                  } else if (lock.status === 'seleccionado') {
                    const currentSessionIdRaw = localStorage.getItem('anonSessionId');
                    const currentSessionId = normalizeSessionId(currentSessionIdRaw);
                    const lockSessionId = normalizeSessionId(lock.session_id?.toString() || '');

                    if (currentSessionId && lockSessionId && currentSessionId === lockSessionId) {
                      visualState = 'seleccionado';
                    } else {
                      visualState = 'seleccionado_por_otro';
                    }
                  }

                  newSeatStates.set(normalizedSeatId, visualState);
                }
              }
            });
            return {
              lockedSeats: currentSeats,
              lockedTables: currentTables,
              seatStates: newSeatStates,
              seatStatesVersion: state.seatStatesVersion + 1,
            };
          });
        };

        // Procesar updates prioritarios primero (inmediatamente)
        if (priorityUpdates.length > 0) {
          processUpdates(priorityUpdates);
        }

        // Procesar updates normales después (usar requestIdleCallback si está disponible)
        if (normalUpdates.length > 0) {
          if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(() => {
              processUpdates(normalUpdates);
            }, { timeout: 200 });
          } else {
            // Fallback: usar setTimeout para no bloquear UI
            setTimeout(() => {
              processUpdates(normalUpdates);
            }, 0);
          }
        }
      };

      const enqueueRealtimeUpdate = (eventType, lock, normalizedSeatId, { immediate = false } = {}) => {
        if (!lock || !normalizedSeatId) {
          return;
        }

        const key = `${eventType}_${normalizedSeatId}`;
        pendingUpdates.set(key, { eventType, lock, normalizedSeatId });
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        const shouldProcessImmediately = immediate || ((eventType === 'INSERT' || eventType === 'UPDATE') && pendingUpdates.size === 1);

        if (shouldProcessImmediately) {
          processPendingUpdates();
          debounceTimer = null;
        } else {
          debounceTimer = setTimeout(() => {
            processPendingUpdates();
            debounceTimer = null;
          }, DEBOUNCE_DELAY);
        }
      };

      const newChannel = supabase
        .channel(`seat-locks-channel-${normalizedFuncionId}`, {
          config: {
            broadcast: { self: true }, // Recibir nuestros propios eventos
            presence: { key: 'user' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seat_locks',
            filter: filter,
          },
          (payload) => {
            if (!payload || !payload.eventType) {
              console.error('❌ [REALTIME] Payload inválido:', payload);
              return;
            }

            let normalizedSeatId = null;
            let lock = null;

            if (payload.eventType === 'DELETE') {
              lock = payload.old;
              normalizedSeatId = lock?.seat_id;
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              lock = payload.new;
              normalizedSeatId = lock?.seat_id;
            }

            if (normalizedSeatId && !normalizedSeatId.startsWith('silla_') && !normalizedSeatId.startsWith('table:')) {
              normalizedSeatId = `silla_${normalizedSeatId}`;
            }

            if (!lock || !normalizedSeatId) {
              return;
            }
            const shouldProcessImmediately = (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && pendingUpdates.size === 0;
            enqueueRealtimeUpdate(payload.eventType, lock, normalizedSeatId, { immediate: shouldProcessImmediately });
          }
        )
        .on(
          'broadcast',
          { event: 'seat-lock-update' },
          (payload) => {
            try {
              const eventPayload = payload?.payload || payload;
              if (!eventPayload) {
                return;
              }

              const { type, eventType: rawEventType, seatId, seatIdWithPrefix, lock: lockPayload } = eventPayload;
              const lock = lockPayload || {};
              const resolvedEventType = rawEventType || (type === 'unlock' ? 'DELETE' : 'INSERT');

              let normalizedSeatId = seatIdWithPrefix || seatId || lock.seat_id;
              if (normalizedSeatId && !normalizedSeatId.startsWith('silla_') && !normalizedSeatId.startsWith('table:')) {
                normalizedSeatId = `silla_${normalizedSeatId}`;
              }

              const preparedLock = {
                ...lock,
                seat_id: normalizedSeatId?.startsWith('silla_') ? normalizedSeatId : lock.seat_id,
                status: eventPayload.status || lock.status,
                session_id: eventPayload.sessionId || lock.session_id,
                lock_type: lock.lock_type || eventPayload.lock_type || 'seat',
                funcion_id: lock.funcion_id || eventPayload.funcionId || normalizedFuncionId,
              };

              enqueueRealtimeUpdate(resolvedEventType, preparedLock, normalizedSeatId, { immediate: true });
            } catch (error) {
              console.error('❌ [REALTIME] Error procesando broadcast:', error, payload);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_transactions',
            filter: tenantId ? `funcion_id=eq.${funcionId},tenant_id=eq.${tenantId}` : `funcion_id=eq.${funcionId}`,
          },
          (payload) => {
            // Procesar eventos de payment_transactions de forma más rápida
            const { eventType, new: newRecord } = payload;

            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const payment = newRecord;
              if (payment.status === 'completed') {
                try {
                  const seats = typeof payment.seats === 'string' ? JSON.parse(payment.seats) : payment.seats;
                  if (Array.isArray(seats)) {
                    set((state) => {
                      const newSeatStates = new Map(state.seatStates);

                      seats.forEach(seat => {
                        const seatId = seat.sillaId || seat.id || seat._id;
                        if (seatId) {
                          // Solo establecer como 'vendido' si NO está ya en seat_locks (prioridad a seat_locks)
                          if (!newSeatStates.has(seatId)) {
                            newSeatStates.set(seatId, 'vendido');
                          }
                        }
                      });

                      return {
                        seatStates: newSeatStates,
                        seatStatesVersion: state.seatStatesVersion + 1
                      };
                    });
                  }
                } catch (error) {
                  console.error('❌ [SEAT_LOCK_STORE] Error parseando seats en payment_transactions:', error);
                }
              }
            }
          }
        )
        .subscribe((status) => {
          // Log del estado de suscripción para debugging
          if (status === 'SUBSCRIBED') {
            // Incrementar contador de referencias
            const currentCount = channelRefCounts.get(expectedTopic) || 0;
            channelRefCounts.set(expectedTopic, currentCount + 1);
            // Actualizar el estado del canal en el store
            const state = get();
            if (typeof window !== 'undefined' && state.pendingReloadTimeout) {
              window.clearTimeout(state.pendingReloadTimeout);
            }
            set({
              channel: newChannel,
              subscriptionRefCount: currentCount + 1,
              connectionIssueDetected: false,
              pendingReloadTimeout: null,
            });
          } else if (status === 'CHANNEL_ERROR') {
            // Error silencioso - no loguear en producción para evitar spam en consola
            // Solo manejar internamente sin mostrar errores repetitivos
            get().handleRealtimeChannelIssue('CHANNEL_ERROR', normalizedFuncionId);
          } else if (status === 'TIMED_OUT') {
            get().handleRealtimeChannelIssue('TIMED_OUT', normalizedFuncionId);
          } else if (status === 'CLOSED') {
            const state = get();
            const activeRefCount = channelRefCounts.get(expectedTopic) || 0;
            const isCurrentChannel = state.channel === newChannel;

            // Si el canal cerrado no es el actual o no hay referencias activas, ignorar el evento
            if (!isCurrentChannel || activeRefCount === 0 || (state.subscriptionRefCount || 0) === 0) {
              if (typeof window !== 'undefined' && state.pendingReloadTimeout) {
                window.clearTimeout(state.pendingReloadTimeout);
              }

              set({
                connectionIssueDetected: false,
                pendingReloadTimeout: null,
              });
              return;
            }
            // No limpiar el canal del store si se cierra - puede estar siendo usado por otros componentes
            get().handleRealtimeChannelIssue('CLOSED', normalizedFuncionId);
          } else {
          }
        });

      // No establecer el canal aquí - esperar a que se suscriba exitosamente
      // set({ channel: newChannel }); // Se establece en el callback de subscribe
    } catch (error) {
      // Error silencioso - manejar internamente sin loguear en producción
      // Los errores de conexión WebSocket son comunes y no requieren logging repetitivo
    }
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      const topic = channel.topic;

      // Decrementar contador de referencias
      const currentCount = channelRefCounts.get(topic) || 0;
      const newCount = Math.max(0, currentCount - 1);
      channelRefCounts.set(topic, newCount);

      console.log(`📊 [SEAT_LOCK_STORE] Referencias de canal ${topic}: ${newCount} (era ${currentCount})`);

      // Solo cerrar el canal si no hay más referencias
      if (newCount === 0) {
        try {
          // Verificar si el canal aún existe antes de desuscribirse
          const existingChannels = supabase.getChannels();
          const channelExists = existingChannels.some(ch => ch.topic === topic);

          if (channelExists) {
            console.log(`🔌 [SEAT_LOCK_STORE] Cerrando canal ${topic} (última referencia)`);
            channel.unsubscribe();
            channelRefCounts.delete(topic);
          }
        } catch (error) {
          // Error silencioso
        }
        set({ channel: null, lockedSeats: [], lockedTables: [], subscriptionRefCount: 0 });
        get().teardownConnectivityListeners();
      } else {
        console.log(`✅ [SEAT_LOCK_STORE] Manteniendo canal ${topic} abierto (${newCount} referencias activas)`);
        // No limpiar el estado si aún hay referencias - otros componentes lo necesitan
      }
    }
  },

  // Bloquear asiento individual usando servicio atómico
  lockSeat: async (seatId, status = 'seleccionado', overrideFuncionId = null) => {
    try {
      const topic = get().channel?.topic;
      const rawSessionId = await getSessionId();
      const sessionId = normalizeSessionId(rawSessionId);

      if (!sessionId) {
        console.error('❌ [SEAT_LOCK] No se pudo obtener session_id válido');
        return false;
      }

      const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
      if (!funcionIdRaw) {
        return false;
      }

      const funcionIdVal = parseInt(funcionIdRaw, 10);
      if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
        return false;
      }

      // Validar datos antes del bloqueo
      const validation = atomicSeatLockService.validateLockData(seatId, funcionIdVal, sessionId);
      if (!validation.isValid) {
        console.error('[SEAT_LOCK] Datos inválidos:', validation.errors);
        return false;
      }

      const {
        normalizedSeatId,
        normalizedFuncionId,
        normalizedSessionId
      } = validation;

      // Usar servicio atómico para el bloqueo (esperar respuesta del servidor)
      const result = await atomicSeatLockService.lockSeatAtomically(
        normalizedSeatId,
        normalizedFuncionId,
        normalizedSessionId,
        status
      );

      if (!result.success) {
        console.error('[SEAT_LOCK] Error en bloqueo atómico:', result.error);
        return false;
      }

      const seatIdForStore = ensureSeatIdWithPrefix(normalizedSeatId);

      // Actualizar estado local INMEDIATAMENTE después de recibir confirmación del servidor
      // Esto asegura que el color se actualice inmediatamente sin esperar Realtime
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        const newLockedSeats = [
          ...currentSeats.filter((s) => ensureSeatIdWithPrefix(s.seat_id) !== seatIdForStore),
          {
            seat_id: seatIdForStore,
            funcion_id: normalizedFuncionId,
            session_id: normalizedSessionId,
            locked_at: result.lockData.locked_at,
            expires_at: result.lockData.expires_at,
            status: result.lockData.status,
            lock_type: 'seat',
            locator: result.lockData.locator,
            id: result.lockData.id,
          },
        ];

        // Actualizar seatStates INMEDIATAMENTE para que el color se aplique al instante
        const newSeatStates = new Map(state.seatStates);
        newSeatStates.set(seatIdForStore, 'seleccionado'); // Amarillo para mi selección

        return {
          lockedSeats: newLockedSeats,
          seatStates: newSeatStates,
          seatStatesVersion: state.seatStatesVersion + 1
        };
      });

      const channel = get().channel;
      if (channel && typeof channel.send === 'function') {
        const broadcastPayload = {
          type: 'lock',
          seatId: normalizedSeatId,
          seatIdWithPrefix: seatIdForStore,
          funcionId: normalizedFuncionId,
          status: result.lockData.status,
          sessionId: normalizedSessionId,
          lock_type: 'seat',
          lock: {
            ...result.lockData,
            seat_id: seatIdForStore,
            session_id: normalizedSessionId,
            lock_type: result.lockData.lock_type || 'seat',
          }
        };

        channel
          .send({ type: 'broadcast', event: 'seat-lock-update', payload: broadcastPayload })
          .then((response) => {
            if (response?.status !== 'ok') {
            }
          })
          .catch((error) => {
            console.error('❌ [SEAT_LOCK_STORE] Error enviando broadcast de lock:', error);
          });
      }

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

    const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionIdRaw) {
      return false;
    }
    const funcionIdVal = parseInt(funcionIdRaw, 10);
    if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
      return false;
    }

    if (!isValidUuid(sessionId)) {
      return false;
    }

    // Validar que tableId sea un string válido (no necesariamente UUID)
    if (!tableId || typeof tableId !== 'string' || tableId.trim() === '') {
      return false;
    }

    const lockedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const tableSeatId = buildTableSeatId(tableId);

    // Obtener el tenant_id actual
    const tenantId = getCurrentTenantId();
    try {
      const lockData = {
        table_id: tableId,
        seat_id: tableSeatId,
        funcion_id: funcionIdVal,
        session_id: sessionId,
        locked_at: lockedAt,
        expires_at: expiresAt,
        status,
        lock_type: 'table',
      };

      // Agregar tenant_id si está disponible
      if (tenantId) {
        lockData.tenant_id = tenantId;
      }

      const { error } = await supabase
        .from('seat_locks')
        .upsert(lockData, { onConflict: 'seat_id,funcion_id,tenant_id' });

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
              seat_id: tableSeatId,
              funcion_id: funcionIdVal,
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

  // Desbloquear asiento individual usando servicio atómico
  unlockSeat: async (seatId, overrideFuncionId = null, options = {}) => {
    // Iniciando proceso de desbloqueo atómico

    try {
      const parsedOptions = typeof options === 'boolean' ? { allowOverrideSession: options } : (options || {});
      const {
        allowOverrideSession = false,
        sessionIdOverride = null,
        allowForceUnlock = false
      } = parsedOptions;

      const topic = get().channel?.topic;
      const sessionIdFromSource = sessionIdOverride || await getSessionId();
      const sessionId = normalizeSessionId(sessionIdFromSource);

      const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
      if (!funcionIdRaw) {
        return false;
      }

      const funcionIdVal = parseInt(funcionIdRaw, 10);
      if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
        return false;
      }

      // Validar datos antes del desbloqueo
      const validation = atomicSeatLockService.validateLockData(seatId, funcionIdVal, sessionId);
      if (!validation.isValid) {
        console.error('[SEAT_LOCK] Datos inválidos:', validation.errors);
        return false;
      }

      const {
        normalizedSeatId,
        normalizedFuncionId,
        normalizedSessionId
      } = validation;

      let sessionIdToUse = normalizedSessionId;

      // Verificar estado local antes del desbloqueo
      const currentSeats = Array.isArray(get().lockedSeats) ? get().lockedSeats : [];
      const seatIdForStore = ensureSeatIdWithPrefix(normalizedSeatId);
      const currentLock = currentSeats.find(
        s => ensureSeatIdWithPrefix(s.seat_id) === seatIdForStore
      );
      if (currentLock?.status === 'pagado' || currentLock?.status === 'reservado') {
        return false;
      }

      const lockSessionId = normalizeSessionId(currentLock?.session_id?.toString() || '');
      if (allowOverrideSession && lockSessionId && lockSessionId !== sessionIdToUse) {
        sessionIdToUse = lockSessionId;
      }
      // Usar servicio atómico para el desbloqueo
      const result = await atomicSeatLockService.unlockSeatAtomically(
        normalizedSeatId,
        normalizedFuncionId,
        sessionIdToUse,
        { allowPermanentOverride: allowForceUnlock }
      );

      if (!result.success) {
        console.error('[SEAT_LOCK] Error en desbloqueo atómico:', result.error);
        return false;
      }

      // Asiento desbloqueado exitosamente

      // Actualización local inmediata - limpiar estado visual también
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        const updatedSeats = currentSeats.filter((s) => ensureSeatIdWithPrefix(s.seat_id) !== seatIdForStore);

        // Limpiar el estado visual del asiento para que vuelva a verde/disponible
        const newSeatStates = new Map(state.seatStates);
        newSeatStates.delete(seatIdForStore);

        return {
          lockedSeats: updatedSeats,
          seatStates: newSeatStates,
          seatStatesVersion: state.seatStatesVersion + 1
        };
      });

      const channel = get().channel;
      if (channel && typeof channel.send === 'function') {
        const broadcastPayload = {
          type: 'unlock',
          seatId: normalizedSeatId,
          seatIdWithPrefix: seatIdForStore,
          funcionId: normalizedFuncionId,
          status: 'liberado',
          sessionId: sessionIdToUse,
          lock_type: 'seat',
          lock: {
            seat_id: seatIdForStore,
            funcion_id: normalizedFuncionId,
            session_id: sessionIdToUse,
            status: 'liberado',
            lock_type: 'seat'
          }
        };

        channel
          .send({ type: 'broadcast', event: 'seat-lock-update', payload: broadcastPayload })
          .then((response) => {
            if (response?.status !== 'ok') {
            }
          })
          .catch((error) => {
            console.error('❌ [SEAT_LOCK_STORE] Error enviando broadcast de unlock:', error);
          });
      }

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

    const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
    if (!funcionIdRaw) {
      return false;
    }
    const funcionIdVal = parseInt(funcionIdRaw, 10);
    if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
      return false;
    }

    if (!isValidUuid(sessionId)) {
      return false;
    }

    // Validar que tableId sea un string válido (no necesariamente UUID)
    if (!tableId || typeof tableId !== 'string' || tableId.trim() === '') {
      return false;
    }

    const currentTables = Array.isArray(get().lockedTables) ? get().lockedTables : [];
    const currentLock = currentTables.find(
      t => t.table_id === tableId && t.session_id === sessionId
    );
    if (currentLock?.status === 'pagado' || currentLock?.status === 'reservado') {
      return false;
    }
    try {
      const { error } = await supabase
        .from('seat_locks')
        .delete()
        .eq('table_id', tableId)
        .eq('funcion_id', funcionIdVal)
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

  // Cache para verificaciones de BD (evita consultas innecesarias)
  seatStatusCache: new Map(),

  // Limpiar cache expirado
  clearExpiredCache: () => {
    const now = Date.now();
    const CACHE_DURATION = 1000; // 1 segundo para pruebas
    const { seatStatusCache } = get();

    for (const [key, value] of seatStatusCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        seatStatusCache.delete(key);
      }
    }
  },

  // Verificar si un asiento está bloqueado por el usuario actual
  isSeatLockedByMe: async (seatId, functionId = null, sessionId = null) => {
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];

    // Validar que functionId no sea null
    if (!functionId) {
      // Solo verificar en estado local
      const currentSessionId = sessionId || localStorage.getItem('anonSessionId');
      const isLockedByMe = seats.some((s) =>
        s.seat_id === seatId &&
        s.session_id === currentSessionId
      );
      return isLockedByMe;
    }

    // Verificar en estado local primero
    const currentSessionId = sessionId || localStorage.getItem('anonSessionId');
    const isLockedByMe = seats.some((s) =>
      s.seat_id === seatId &&
      s.funcion_id === functionId &&
      s.session_id === currentSessionId
    );

    if (isLockedByMe) {
      // Asiento bloqueado por el usuario actual
      return true;
    }

    // Verificar en BD si no está en estado local
    try {
      // Validar que currentSessionId no sea null o vacío
      if (!currentSessionId || currentSessionId.trim() === '') {
        return false;
      }

      // Usar maybeSingle() en lugar de single() para evitar errores 406
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('seat_id', seatId)
        .eq('funcion_id', functionId)
        .eq('session_id', currentSessionId)
        .maybeSingle();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  },

  // Verificar si un asiento está bloqueado (con cache inteligente)
  isSeatLocked: async (seatId, functionId = null) => {
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];

    // Validar que functionId no sea null para consultas a BD
    if (!functionId) {
      // Solo verificar en estado local
      const isLockedLocally = seats.some((s) => s.seat_id === seatId);
      return isLockedLocally;
    }

    // Verificar en estado local primero (más rápido)
    let isLockedLocally = false;
    isLockedLocally = seats.some((s) => s.seat_id === seatId && s.funcion_id === functionId);

    // Si NO está bloqueado localmente, verificar en BD para estar seguros
    if (!isLockedLocally) {
      // Verificar cache antes de consultar BD
      const cacheKey = `${seatId}_${functionId}`;
      const cached = get().seatStatusCache.get(cacheKey);
      const now = Date.now();
      const CACHE_DURATION = 1000; // 1 segundo para pruebas

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('📋 [SEAT_LOCK] Usando cache para asiento (no bloqueado localmente):', seatId);
        return cached.isLocked;
      }

      // Consultar BD para verificar si está bloqueado por otro usuario
      try {
        // Verificando BD para asiento (no bloqueado localmente)
        const { data, error } = await supabase
          .from('seat_locks')
          .select('*')
          .eq('seat_id', seatId)
          .eq('funcion_id', functionId)
          .maybeSingle();

        if (error) {
          return false; // Si hay error, asumir que no está bloqueado
        }

        const isLocked = !!data;

        // Actualizar cache
        get().seatStatusCache.set(cacheKey, {
          isLocked,
          timestamp: now
        });

        return isLocked;
      } catch (error) {
        return false; // Si hay error, asumir que no está bloqueado
      }
    }

    // Si está bloqueado localmente, confirmar en BD
    const cacheKey = `${seatId}_${functionId}`;
    const cached = get().seatStatusCache.get(cacheKey);
    const now = Date.now();
    const CACHE_DURATION = 1000; // 1 segundo para pruebas

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 [SEAT_LOCK] Usando cache para asiento (bloqueado localmente):', seatId);
      return cached.isLocked;
    }

    // Solo consultar BD si no hay cache válido
    try {
      // Confirmando en BD para asiento (bloqueado localmente)
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('seat_id', seatId)
        .eq('funcion_id', functionId)
        .maybeSingle();

      if (error) {
        return isLockedLocally; // Fallback al estado local
      }

      const isLocked = !!data;

      // Actualizar cache
      get().seatStatusCache.set(cacheKey, {
        isLocked,
        timestamp: now
      });

      return isLocked;
    } catch (error) {
      return isLockedLocally; // Fallback al estado local
    }
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

// Exponer el store globalmente para debugging
if (typeof window !== 'undefined') {
  window.seatLockStore = useSeatLockStore;
  window.supabase = supabase;

  // Exponer funciones de limpieza para debugging
  window.clearSeatState = (seatId) => {
    const store = useSeatLockStore.getState();
    store.clearSeatState(seatId);
  };

  window.clearAllSeatStates = () => {
    const store = useSeatLockStore.getState();
    store.clearAllSeatStates();
  };
  console.log('🔧 [SEAT_LOCK_STORE] Funciones disponibles: clearSeatState(seatId), clearAllSeatStates()');
}
