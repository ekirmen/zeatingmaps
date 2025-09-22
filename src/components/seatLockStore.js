import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import atomicSeatLockService from '../services/atomicSeatLock';
import { updateSeatStateInMapa } from '../utils/updateSeatStateInMapa';

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
    console.warn('⚠️ No se pudo obtener el tenant_id para el bloqueo de asiento.');
    return null;
  } catch (error) {
    console.warn('No se pudo obtener el tenant ID:', error);
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

// Función para obtener configuraciones de tiempo
function getSeatSettings() {
  const lockExpirationMinutes = parseInt(localStorage.getItem('cart_lock_minutes') || '15', 10);
  const preserveTimeMinutes = parseInt(localStorage.getItem('seat_preserve_time') || '5', 10);
  const warningTimeMinutes = parseInt(localStorage.getItem('seat_warning_time') || '3', 10);
  const enableAutoCleanup = localStorage.getItem('seat_auto_cleanup') !== 'false';
  const enableRestoration = localStorage.getItem('seat_restoration') !== 'false';
  
  return {
    lockExpirationMinutes,
    preserveTimeMinutes,
    warningTimeMinutes,
    enableAutoCleanup,
    enableRestoration
  };
}

// Función para limpiar bloqueos abandonados de forma inteligente
async function cleanupAbandonedLocks() {
  try {
    console.log('🧹 [CLEANUP] Iniciando limpieza inteligente de bloqueos...');
    
    const settings = getSeatSettings();
    if (!settings.enableAutoCleanup) {
      console.log('⏸️ [CLEANUP] Limpieza automática deshabilitada');
      return;
    }
    
    const now = new Date();
    const preserveTimeAgo = new Date(now.getTime() - settings.preserveTimeMinutes * 60 * 1000);
    const lockExpirationAgo = new Date(now.getTime() - settings.lockExpirationMinutes * 60 * 1000);
    
    // 1. Limpiar bloqueos de más del tiempo de expiración (limpieza completa)
    const { data: oldLocks, error: oldError } = await supabase
      .from('seat_locks')
      .delete()
      .lt('locked_at', lockExpirationAgo.toISOString())
      .neq('status', 'pagado');

    if (oldError) {
      console.error('❌ [CLEANUP] Error limpiando bloqueos antiguos:', oldError);
    } else {
      console.log('✅ [CLEANUP] Bloqueos antiguos eliminados:', oldLocks?.length || 0);
    }

    // 2. Marcar como "expirando" bloqueos entre tiempo de preservación y expiración
    const { data: expiringLocks, error: expiringError } = await supabase
      .from('seat_locks')
      .update({ status: 'expirando' })
      .lt('locked_at', preserveTimeAgo.toISOString())
      .gte('locked_at', lockExpirationAgo.toISOString())
      .eq('status', 'seleccionado');

    if (expiringError) {
      console.error('❌ [CLEANUP] Error marcando bloqueos expirando:', expiringError);
    } else {
      console.log('⚠️ [CLEANUP] Bloqueos marcados como expirando:', expiringLocks?.length || 0);
    }

  } catch (error) {
    console.error('❌ [CLEANUP] Error inesperado en limpieza inteligente:', error);
  }
}

// Función para limpiar bloqueos de una sesión específica (solo si han pasado más del tiempo de preservación)
async function cleanupSessionLocks(sessionId) {
  try {
    console.log('🧹 [CLEANUP] Verificando bloqueos de sesión:', sessionId);
    
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
      console.log('✅ [CLEANUP] Bloqueos de sesión eliminados:', data?.length || 0);
    }
  } catch (error) {
    console.error('❌ [CLEANUP] Error inesperado limpiando sesión:', error);
  }
}

// Función para restaurar bloqueos de una sesión (cuando el usuario regresa)
async function restoreSessionLocks(sessionId) {
  try {
    console.log('🔄 [CLEANUP] Restaurando bloqueos de sesión:', sessionId);
    
    const settings = getSeatSettings();
    if (!settings.enableRestoration) {
      console.log('⏸️ [CLEANUP] Restauración deshabilitada');
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
      console.log('✅ [CLEANUP] Bloqueos restaurados:', data?.length || 0);
    }
  } catch (error) {
    console.error('❌ [CLEANUP] Error inesperado restaurando bloqueos:', error);
  }
}

export const useSeatLockStore = create((set, get) => ({
  lockedSeats: [],
  lockedTables: [], // Nuevo: para bloquear mesas completas
  channel: null,
  cleanupInterval: null, // Intervalo para limpieza automática
  mapa: null, // Mapa actual para actualizar estados de asientos

  setLockedSeats: (seats) => {
    // Validar que seats sea un array
    const validSeats = Array.isArray(seats) ? seats : [];
    set({ lockedSeats: validSeats });
  },

  setMapa: (mapa) => {
    set({ mapa });
  },

  setLockedTables: (tables) => {
    // Validar que tables sea un array
    const validTables = Array.isArray(tables) ? tables : [];
    set({ lockedTables: validTables });
  },

  // Función para iniciar limpieza automática mejorada
  startAutoCleanup: (intervalMinutes = 5) => {
    console.log(`🔄 [CLEANUP] Iniciando limpieza automática mejorada cada ${intervalMinutes} minutos...`);
    
    // Limpiar bloqueos abandonados con intervalo configurable
    const interval = setInterval(async () => {
      try {
        // Usar servicio atómico para limpieza
        const result = await atomicSeatLockService.cleanupExpiredLocks();
        if (result.success) {
          console.log(`✅ [CLEANUP] Limpieza automática completada: ${result.cleaned} bloqueos limpiados`);
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
      console.log('🛑 [CLEANUP] Limpieza automática detenida');
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

    const currentChannel = get().channel;
    const expectedTopic = `seat-locks-channel-${funcionId}`;
    
    // Si ya estamos suscritos al canal correcto, no hacer nada
    if (currentChannel && currentChannel.topic === expectedTopic) {
      return;
    }

    // Limpiar suscripción anterior si existe
    if (currentChannel) {
      try {
        currentChannel.unsubscribe();
      } catch (error) {
        // Error silencioso
      }
    }

    const fetchInitialLocks = async () => {
      try {
        const { data, error } = await supabase
          .from('seat_locks')
          .select('seat_id, table_id, session_id, locked_at, status, lock_type')
          .eq('funcion_id', funcionId);

        if (error) {
          set({ lockedSeats: [], lockedTables: [] });
        } else {
          // Validar que data sea un array
          const validData = Array.isArray(data) ? data : [];
          
          // Separar bloqueos de asientos y mesas
          const seatLocks = validData.filter(lock => lock.lock_type === 'seat' || !lock.lock_type);
          const tableLocks = validData.filter(lock => lock.lock_type === 'table');
          
          set({ 
            lockedSeats: seatLocks,
            lockedTables: tableLocks
          });
        }
      } catch (error) {
        set({ lockedSeats: [], lockedTables: [] });
      }
    };
    fetchInitialLocks();

    try {
      // Verificar si ya existe un canal con el mismo topic antes de crear uno nuevo
      const existingChannel = supabase.getChannels().find(ch => ch.topic === expectedTopic);
      if (existingChannel) {
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
          // Estado de suscripción manejado silenciosamente
        });

      set({ channel: newChannel });
    } catch (error) {
      // Error silencioso
    }
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      try {
        // Verificar si el canal aún existe antes de desuscribirse
        const existingChannels = supabase.getChannels();
        const channelExists = existingChannels.some(ch => ch.topic === channel.topic);
        
        if (channelExists) {
          channel.unsubscribe();
        }
      } catch (error) {
        // Error silencioso
      }
      set({ channel: null, lockedSeats: [], lockedTables: [] });
    }
  },

  // Bloquear asiento individual usando servicio atómico
  lockSeat: async (seatId, status = 'seleccionado', overrideFuncionId = null) => {
    console.log('🚀 [SEAT_LOCK] Iniciando proceso de bloqueo atómico para asiento:', seatId);
    
    try {
      const topic = get().channel?.topic;
      const sessionId = normalizeSessionId(await getSessionId());

      const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
      if (!funcionIdRaw) {
        console.warn('[SEAT_LOCK] funcion_id inválido');
        return false;
      }

      const funcionIdVal = parseInt(funcionIdRaw, 10);
      if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
        console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionIdRaw);
        return false;
      }

      // Validar datos antes del bloqueo
      const validation = atomicSeatLockService.validateLockData(seatId, funcionIdVal, sessionId);
      if (!validation.isValid) {
        console.error('[SEAT_LOCK] Datos inválidos:', validation.errors);
        return false;
      }

      // Usar servicio atómico para el bloqueo
      const result = await atomicSeatLockService.lockSeatAtomically(
        seatId,
        funcionIdVal,
        sessionId,
        status
      );

      if (!result.success) {
        console.error('[SEAT_LOCK] Error en bloqueo atómico:', result.error);
        return false;
      }

      console.log('💾 [SEAT_LOCK] Asiento bloqueado exitosamente con servicio atómico');

      // Actualización local inmediata
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        console.log('📊 [SEAT_LOCK] Estado local ANTES del cambio:', currentSeats);
        
        const newLockedSeats = [
          ...currentSeats.filter((s) => s.seat_id !== seatId),
          {
            seat_id: seatId,
            funcion_id: funcionIdVal,
            session_id: sessionId,
            locked_at: result.lockData.locked_at,
            expires_at: result.lockData.expires_at,
            status: result.lockData.status,
            lock_type: 'seat',
            locator: result.lockData.locator,
          },
        ];
        console.log('🔒 [SEAT_LOCK] Estado local DESPUÉS del cambio:', newLockedSeats);
        return {
          lockedSeats: newLockedSeats,
        };
      });

      console.log('✅ Asiento bloqueado exitosamente en DB y estado local');
      
      // Actualizar el estado del asiento en el mapa para que otros usuarios vean que está seleccionado
      const { updateSeatStateInMapa } = await import('../utils/updateSeatStateInMapa');
      const currentMapa = get().mapa;
      if (currentMapa) {
        const updatedMapa = updateSeatStateInMapa(currentMapa, seatId, 'seleccionado_por_otro');
        set({ mapa: updatedMapa });
        console.log('🔄 [SEAT_LOCK] Estado del asiento actualizado en el mapa para otros usuarios');
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
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }
    const funcionIdVal = parseInt(funcionIdRaw, 10);
    if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionIdRaw);
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

    // Obtener el tenant_id actual
    const tenantId = getCurrentTenantId();
    
    console.log('[SEAT_LOCK] Intentando bloquear mesa:', {
      table_id: tableId,
      funcion_id: funcionIdVal,
      session_id: sessionId,
      status,
      lock_type: 'table',
      tenant_id: tenantId
    });

    try {
      const lockData = {
        table_id: tableId,
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
        .upsert(lockData);

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
  unlockSeat: async (seatId, overrideFuncionId = null) => {
    console.log('🚀 [SEAT_LOCK] Iniciando proceso de desbloqueo atómico para asiento:', seatId);
    
    try {
      const topic = get().channel?.topic;
      const sessionId = normalizeSessionId(await getSessionId());

      const funcionIdRaw = overrideFuncionId || topic?.split('seat-locks-channel-')[1];
      if (!funcionIdRaw) {
        console.warn('[SEAT_LOCK] funcion_id inválido');
        return false;
      }

      const funcionIdVal = parseInt(funcionIdRaw, 10);
      if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
        console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionIdRaw);
        return false;
      }

      // Validar datos antes del desbloqueo
      const validation = atomicSeatLockService.validateLockData(seatId, funcionIdVal, sessionId);
      if (!validation.isValid) {
        console.error('[SEAT_LOCK] Datos inválidos:', validation.errors);
        return false;
      }

      // Verificar estado local antes del desbloqueo
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
        funcion_id: funcionIdVal,
        session_id: sessionId
      });

      // Usar servicio atómico para el desbloqueo
      const result = await atomicSeatLockService.unlockSeatAtomically(
        seatId,
        funcionIdVal,
        sessionId
      );

      if (!result.success) {
        console.error('[SEAT_LOCK] Error en desbloqueo atómico:', result.error);
        return false;
      }

      console.log('💾 [SEAT_LOCK] Asiento desbloqueado exitosamente con servicio atómico');
    
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
      
      // Restaurar el estado del asiento en el mapa para que otros usuarios vean que está disponible
      const { updateSeatStateInMapa } = await import('../utils/updateSeatStateInMapa');
      const currentMapa = get().mapa;
      if (currentMapa) {
        const updatedMapa = updateSeatStateInMapa(currentMapa, seatId, 'disponible');
        set({ mapa: updatedMapa });
        console.log('🔄 [SEAT_LOCK] Estado del asiento restaurado en el mapa para otros usuarios');
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
      console.warn('[SEAT_LOCK] funcion_id inválido');
      return false;
    }
    const funcionIdVal = parseInt(funcionIdRaw, 10);
    if (!Number.isFinite(funcionIdVal) || funcionIdVal <= 0) {
      console.warn('[SEAT_LOCK] funcion_id no es un número válido:', funcionIdRaw);
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
      funcion_id: funcionIdVal,
      session_id: sessionId
    });

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
