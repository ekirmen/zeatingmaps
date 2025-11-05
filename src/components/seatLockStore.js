import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import atomicSeatLockService from '../services/atomicSeatLock';

const buildTableSeatId = (tableId) => `table:${tableId}`;

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
    console.warn('⚠️ [SESSION] session_id no tiene formato UUID válido:', value);
    // Si no es válido, generar uno nuevo
    const newUuid = crypto?.randomUUID?.() || generateUuidFallback();
    console.warn('⚠️ [SESSION] Generando nuevo UUID:', newUuid);
    localStorage.setItem('anonSessionId', newUuid);
    return newUuid;
  }
  
  return value;
}

// Función auxiliar para generar UUID si crypto.randomUUID no está disponible
function generateUuidFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
  mapa: null, // Mapa original (no se actualiza)
  seatStates: new Map(), // Estados actualizados de asientos individuales

  setLockedSeats: (seats) => {
    // Validar que seats sea un array
    const validSeats = Array.isArray(seats) ? seats : [];
    set({ lockedSeats: validSeats });
  },

  setMapa: (mapa) => {
    set({ mapa });
  },

  // Actualizar estado de un asiento individual sin tocar el mapa completo
  updateSeatState: (seatId, newState) => {
    set((state) => {
      const newSeatStates = new Map(state.seatStates);
      newSeatStates.set(seatId, newState);
      return { seatStates: newSeatStates };
    });
  },

  // Función específica para actualizar seatStates desde el exterior
  setSeatStates: (newSeatStates) => {
    set({ seatStates: newSeatStates });
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
      console.log('🧹 [SEAT_LOCK_STORE] Estado limpiado manualmente para asiento:', seatId);
      return { seatStates: newSeatStates };
    });
  },

  // Función para limpiar todos los estados de asientos (útil para debugging)
  clearAllSeatStates: () => {
    set((state) => {
      console.log('🧹 [SEAT_LOCK_STORE] Limpiando todos los estados de asientos');
      return { seatStates: new Map() };
    });
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
        console.log('🔄 [SEAT_LOCK_STORE] Cargando datos iniciales para función:', funcionId);
        
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
            .eq('funcion_id', funcionId);
          
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
            .eq('funcion_id', funcionId)
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
            const params = new URLSearchParams({ funcionId: String(funcionId) });
            if (tenantId) {
              params.set('tenantId', tenantId);
            }

            const response = await fetch(`/api/seat-locks/status?${params.toString()}`);
            if (response.ok) {
              const payload = await response.json();
              seatLocksData = Array.isArray(payload.lockedSeats) ? payload.lockedSeats : [];
              paymentData = Array.isArray(payload.transactions) ? payload.transactions : [];
              console.log('🌐 [SEAT_LOCK_STORE] Datos cargados vía API fallback', {
                seatLocks: seatLocksData.length,
                transactions: paymentData.length
              });
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
        const currentSessionId = localStorage.getItem('anonSessionId') || 'unknown';
        
        // Procesar asientos de seat_locks
        seatLocks.forEach(lock => {
          let visualState = 'seleccionado_por_otro'; // Estado por defecto
          
          if (lock.status === 'pagado' || lock.status === 'vendido') {
            visualState = 'vendido';
          } else if (lock.status === 'reservado') {
            visualState = 'reservado';
          } else if (lock.status === 'seleccionado') {
            // Verificar si es del usuario actual
            if (lock.session_id === currentSessionId) {
              visualState = 'seleccionado';
            } else {
              visualState = 'seleccionado_por_otro';
            }
          }
          
          newSeatStates.set(lock.seat_id, visualState);
          // Estado inicial del asiento (seat_locks)
        });

        // Procesar asientos vendidos de payment_transactions
        // PRIORIDAD: payment_transactions tiene precedencia sobre seat_locks
        soldSeats.forEach((seatInfo, seatId) => {
          // SIEMPRE establecer como 'vendido' si está en payment_transactions, sin importar seat_locks
          newSeatStates.set(seatId, 'vendido');
          // Estado inicial del asiento (payment_transactions - PRIORIDAD)
        });
        
        set({ 
          lockedSeats: seatLocks,
          lockedTables: tableLocks,
          seatStates: newSeatStates
        });
      } catch (error) {
        console.error('❌ [SEAT_LOCK_STORE] Error en fetchInitialLocks:', error);
        set({ lockedSeats: [], lockedTables: [] });
      }
    };
    fetchInitialLocks();

    try {
      // Verificar si ya existe un canal con el mismo topic antes de crear uno nuevo
      const channels = supabase.getChannels();
      const existingChannel = Array.isArray(channels) ? channels.find(ch => ch.topic === expectedTopic) : null;
      if (existingChannel) {
        console.log('✅ [SEAT_LOCK_STORE] Reutilizando canal existente:', expectedTopic);
        set({ channel: existingChannel });
        return;
      }
      
      // Desuscribirse de canales anteriores si existen
      if (channels && channels.length > 0) {
        console.log('🧹 [SEAT_LOCK_STORE] Limpiando canales anteriores:', channels.length);
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
      let filter = `funcion_id=eq.${funcionId}`;
      if (tenantId) {
        filter = `${filter},tenant_id=eq.${tenantId}`;
      }
      
      console.log('📡 [SEAT_LOCK_STORE] Creando canal Realtime para función:', funcionId, 'Filtro:', filter);

      const newChannel = supabase
        .channel(`seat-locks-channel-${funcionId}`, {
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
            // Procesar eventos de forma más rápida sin logs excesivos
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newLock = payload.new;
              
              // Debug: verificar que el evento se recibe correctamente
            console.log('🔔 [SEAT_LOCK_STORE] Evento recibido:', {
              eventType: payload.eventType,
                seatId: newLock.seat_id,
                status: newLock.status,
                sessionId: newLock.session_id,
                currentSessionId: localStorage.getItem('anonSessionId')
            });
              
              set((state) => {
                const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
                const currentTables = Array.isArray(state.lockedTables) ? state.lockedTables : [];
                
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
                  
                  // Actualizar el estado del asiento individual en seatStates
                  const newSeatStates = new Map(state.seatStates);
                  
                  // Determinar el estado visual basado en el status del lock
                  let visualState = 'seleccionado_por_otro'; // Estado por defecto
                  
                  if (newLock.status === 'pagado' || newLock.status === 'vendido') {
                    visualState = 'vendido';
                  } else if (newLock.status === 'reservado') {
                    visualState = 'reservado';
                  } else if (newLock.status === 'seleccionado') {
                    // Verificar si es del usuario actual - normalizar ambos session_ids para comparar correctamente
                    const currentSessionIdRaw = localStorage.getItem('anonSessionId');
                    const currentSessionId = normalizeSessionId(currentSessionIdRaw);
                    const lockSessionId = normalizeSessionId(newLock.session_id?.toString() || '');
                    
                    // Comparar session_ids normalizados
                    if (currentSessionId && lockSessionId && currentSessionId === lockSessionId) {
                      visualState = 'seleccionado';
                      console.log('✅ [SEAT_LOCK_STORE] Asiento seleccionado por mí:', newLock.seat_id);
                    } else {
                      visualState = 'seleccionado_por_otro';
                      console.log('⚠️ [SEAT_LOCK_STORE] Asiento seleccionado por otro:', newLock.seat_id, {
                        otherSessionId: lockSessionId,
                        currentSessionId: currentSessionId,
                        rawOtherSessionId: newLock.session_id,
                        rawCurrentSessionId: currentSessionIdRaw
                      });
                    }
                  }
                  
                  newSeatStates.set(newLock.seat_id, visualState);
                  
                  console.log('🎨 [SEAT_LOCK_STORE] Estado visual actualizado:', {
                    seatId: newLock.seat_id,
                    visualState: visualState,
                    status: newLock.status
                  });
                  
                  return { 
                    lockedSeats: updatedSeats, 
                    seatStates: newSeatStates 
                  };
                }
              });
            }
            if (payload.eventType === 'DELETE') {
              // Para eventos DELETE, Supabase envía el ID, necesitamos buscar el seat_id
              const deletedId = payload.old?.id;
              const deletedSeatId = payload.old?.seat_id; // Supabase puede enviar seat_id directamente
              
              if (!deletedId && !deletedSeatId) {
                return; // No procesar si no hay ID
              }
              
              // Buscar el asiento en el estado actual para obtener el seat_id
              const currentState = get();
              const currentSeats = Array.isArray(currentState.lockedSeats) ? currentState.lockedSeats : [];
              const currentTables = Array.isArray(currentState.lockedTables) ? currentState.lockedTables : [];
              
              // Buscar en asientos bloqueados
              let seatId = deletedSeatId;
              if (!seatId && deletedId) {
              const deletedSeat = currentSeats.find(lock => lock.id === deletedId);
                seatId = deletedSeat?.seat_id;
              }
              
              if (seatId) {
                // Es un desbloqueo de asiento
                set((state) => {
                  const updatedSeats = deletedId 
                    ? state.lockedSeats.filter(lock => lock.id !== deletedId)
                    : state.lockedSeats.filter(lock => lock.seat_id !== seatId);
                  
                  // ELIMINAR completamente el asiento del seatStates para forzar que vuelva a verde
                  const newSeatStates = new Map(state.seatStates);
                  newSeatStates.delete(seatId);
                  
                  return { 
                    lockedSeats: updatedSeats, 
                    seatStates: newSeatStates 
                  };
                });
              } else if (deletedId) {
                // Buscar en mesas
                const deletedTable = currentTables.find(lock => lock.id === deletedId);
                if (deletedTable) {
                set((state) => {
                  const updatedTables = state.lockedTables.filter(lock => lock.id !== deletedId);
                  return { lockedTables: updatedTables };
                });
                }
              }
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
                      
                      return { seatStates: newSeatStates };
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
            console.log('✅ [SEAT_LOCK_STORE] Suscrito exitosamente a Realtime para función:', funcionId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [SEAT_LOCK_STORE] Error en canal Realtime:', status);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ [SEAT_LOCK_STORE] Timeout en suscripción Realtime:', status);
          } else {
            console.log('📡 [SEAT_LOCK_STORE] Estado de suscripción:', status);
          }
        });

      set({ channel: newChannel });
      console.log('📡 [SEAT_LOCK_STORE] Canal creado, esperando suscripción...');
    } catch (error) {
      console.error('❌ [SEAT_LOCK_STORE] Error creando canal Realtime:', error);
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

      // Actualizar estado local DESPUÉS de recibir confirmación del servidor
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        const newLockedSeats = [
          ...currentSeats.filter((s) => s.seat_id !== normalizedSeatId),
          {
            seat_id: normalizedSeatId,
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
        
        // Actualizar estado visual (amarillo = seleccionado por mí)
        const newSeatStates = new Map(state.seatStates);
        newSeatStates.set(normalizedSeatId, 'seleccionado'); // Amarillo
        
        return {
          lockedSeats: newLockedSeats,
          seatStates: newSeatStates,
        };
      });
      
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
    const tableSeatId = buildTableSeatId(tableId);

    // Obtener el tenant_id actual
    const tenantId = getCurrentTenantId();
    
    console.log('[SEAT_LOCK] Intentando bloquear mesa:', {
      table_id: tableId,
      seat_id: tableSeatId,
      funcion_id: funcionIdVal,
      session_id: sessionId,
      status,
      lock_type: 'table',
      tenant_id: tenantId
    });

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
  unlockSeat: async (seatId, overrideFuncionId = null) => {
    // Iniciando proceso de desbloqueo atómico
    
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

      const {
        normalizedSeatId,
        normalizedFuncionId,
        normalizedSessionId
      } = validation;

      // Verificar estado local antes del desbloqueo
      const currentSeats = Array.isArray(get().lockedSeats) ? get().lockedSeats : [];
      const currentLock = currentSeats.find(
        s => s.seat_id === normalizedSeatId && s.session_id === normalizedSessionId
      );
      if (currentLock?.status === 'pagado' || currentLock?.status === 'reservado') {
        console.warn('[SEAT_LOCK] No se puede desbloquear un asiento pagado o reservado');
        return false;
      }

      console.log('[SEAT_LOCK] Intentando desbloquear asiento:', {
        seat_id: normalizedSeatId,
        funcion_id: normalizedFuncionId,
        session_id: normalizedSessionId
      });

      // Usar servicio atómico para el desbloqueo
      const result = await atomicSeatLockService.unlockSeatAtomically(
        normalizedSeatId,
        normalizedFuncionId,
        normalizedSessionId
      );

      if (!result.success) {
        console.error('[SEAT_LOCK] Error en desbloqueo atómico:', result.error);
        return false;
      }

      // Asiento desbloqueado exitosamente
    
      // Actualización local inmediata
      set((state) => {
        const currentSeats = Array.isArray(state.lockedSeats) ? state.lockedSeats : [];
        // Estado local ANTES del desbloqueo

        const updatedSeats = currentSeats.filter((s) => s.seat_id !== normalizedSeatId);
        // Estado local DESPUÉS del desbloqueo
        return {
          lockedSeats: updatedSeats,
        };
      });

      // Asiento desbloqueado exitosamente

      // Solo eliminar del seatStates si el asiento estaba temporalmente bloqueado/seleccionado
      // No sobrescribir el estado original del asiento (reservado, pagado, etc.)
      set((state) => {
        const newSeatStates = new Map(state.seatStates);
        const currentState = newSeatStates.get(normalizedSeatId);
        
        // Solo eliminar si el estado actual es temporal (seleccionado, bloqueado temporal)
        if (currentState === 'seleccionado' || currentState === 'seleccionado_por_otro' || currentState === 'locked') {
          newSeatStates.delete(normalizedSeatId); // Eliminar para volver al estado original
          console.log('✅ [SEAT_LOCK] Estado temporal eliminado, volviendo al estado original del asiento');
        } else {
          console.log('✅ [SEAT_LOCK] Manteniendo estado original del asiento:', currentState);
        }

        return {
          ...state,
          seatStates: newSeatStates
        };
      });
      
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
    
    console.log('🧹 [SEAT_LOCK] Cache limpiado, entradas restantes:', seatStatusCache.size);
  },
  
      // Verificar si un asiento está bloqueado por el usuario actual
      isSeatLockedByMe: async (seatId, functionId = null, sessionId = null) => {
        const { lockedSeats } = get();
        const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
        
        // Validar que functionId no sea null
        if (!functionId) {
          console.warn('⚠️ [SEAT_LOCK] functionId es null, no se puede verificar en BD:', seatId);
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
            console.warn('⚠️ [SEAT_LOCK] sessionId inválido para consulta BD:', currentSessionId);
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
            console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
            return false;
          }
          
          return !!data;
        } catch (error) {
          console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
          return false;
        }
      },

      // Verificar si un asiento está bloqueado (con cache inteligente)
      isSeatLocked: async (seatId, functionId = null) => {
    const { lockedSeats } = get();
    const seats = Array.isArray(lockedSeats) ? lockedSeats : [];
    
    // Validar que functionId no sea null para consultas a BD
    if (!functionId) {
      console.warn('⚠️ [SEAT_LOCK] functionId es null, solo verificando estado local:', seatId);
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
          console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
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
        console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
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
        console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
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
      console.warn('⚠️ [SEAT_LOCK] Error verificando asiento en BD:', error);
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
  
  console.log('🔧 [SEAT_LOCK_STORE] Store, Supabase y funciones de limpieza expuestas globalmente para debugging');
  console.log('🔧 [SEAT_LOCK_STORE] Funciones disponibles: clearSeatState(seatId), clearAllSeatStates()');
}
