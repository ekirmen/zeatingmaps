// Script para diagnosticar problemas de sincronización en tiempo real
// Ejecutar en la consola del navegador

console.log('🔍 [DIAGNOSE] Iniciando diagnóstico de sincronización');

// Función para verificar configuración de Supabase
function diagnoseSupabaseConfig() {
  console.log('🔍 [DIAGNOSE] Verificando configuración de Supabase...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [DIAGNOSE] Supabase no está disponible globalmente');
    return false;
  }
  
  console.log('✅ [DIAGNOSE] Supabase disponible:', {
    url: supabase.supabaseUrl,
    key: supabase.supabaseKey ? 'Configurado' : 'No configurado'
  });
  
  // Verificar canales activos
  const channels = supabase.getChannels();
  console.log('📊 [DIAGNOSE] Canales activos:', channels.length);
  
  channels.forEach((channel, index) => {
    console.log(`📊 [DIAGNOSE] Canal ${index + 1}:`, {
      topic: channel.topic,
      status: channel.state,
      config: channel.config
    });
  });
  
  return true;
}

// Función para verificar estado del seatLockStore
function diagnoseSeatLockStore() {
  console.log('🔍 [DIAGNOSE] Verificando estado del seatLockStore...');
  
  const seatStore = window.seatLockStore || window.__SEAT_LOCK_STORE__;
  if (!seatStore) {
    console.error('❌ [DIAGNOSE] seatLockStore no está disponible globalmente');
    return false;
  }
  
  const state = seatStore.getState();
  console.log('✅ [DIAGNOSE] Estado del seatLockStore:', {
    lockedSeats: state.lockedSeats,
    lockedTables: state.lockedTables,
    seatStates: state.seatStates,
    currentSessionId: state.currentSessionId,
    isSubscribed: state.isSubscribed,
    currentFunctionId: state.currentFunctionId
  });
  
  return true;
}

// Función para verificar estado del cartStore
function diagnoseCartStore() {
  console.log('🔍 [DIAGNOSE] Verificando estado del cartStore...');
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [DIAGNOSE] cartStore no está disponible globalmente');
    return false;
  }
  
  const state = cartStore.getState();
  console.log('✅ [DIAGNOSE] Estado del cartStore:', {
    items: state.items,
    itemsCount: state.items.length,
    functionId: state.functionId,
    cartExpiration: state.cartExpiration,
    timeLeft: state.timeLeft
  });
  
  return true;
}

// Función para verificar configuración de RLS
async function diagnoseRLS() {
  console.log('🔍 [DIAGNOSE] Verificando configuración de RLS...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [DIAGNOSE] Supabase no está disponible globalmente');
    return false;
  }
  
  try {
    // Verificar si podemos acceder a seat_locks
    const { data, error } = await supabase
      .from('seat_locks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ [DIAGNOSE] Error accediendo a seat_locks:', error);
      return false;
    }
    
    console.log('✅ [DIAGNOSE] Acceso a seat_locks OK:', data);
    return true;
  } catch (error) {
    console.error('❌ [DIAGNOSE] Error verificando RLS:', error);
    return false;
  }
}

// Función para verificar funciones RPC
async function diagnoseRPCFunctions() {
  console.log('🔍 [DIAGNOSE] Verificando funciones RPC...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [DIAGNOSE] Supabase no está disponible globalmente');
    return false;
  }
  
  const functions = ['lock_seat_atomically', 'unlock_seat_atomically', 'check_seat_availability'];
  
  for (const funcName of functions) {
    try {
      // Intentar llamar la función con parámetros de prueba
      const { data, error } = await supabase.rpc(funcName, {
        p_seat_id: 'test_seat',
        p_funcion_id: 999,
        p_session_id: 'test_session'
      });
      
      if (error) {
        console.log(`⚠️ [DIAGNOSE] Función ${funcName}:`, error.message);
      } else {
        console.log(`✅ [DIAGNOSE] Función ${funcName}: OK`);
      }
    } catch (error) {
      console.log(`❌ [DIAGNOSE] Función ${funcName}:`, error.message);
    }
  }
}

// Función para verificar eventos en tiempo real
function diagnoseRealtimeEvents() {
  console.log('🔍 [DIAGNOSE] Verificando eventos en tiempo real...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [DIAGNOSE] Supabase no está disponible globalmente');
    return false;
  }
  
  // Crear un canal de prueba
  const testChannel = supabase
    .channel('test-sync')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'seat_locks'
    }, (payload) => {
      console.log('🔔 [DIAGNOSE] Evento de prueba recibido:', payload);
    })
    .subscribe((status) => {
      console.log('📊 [DIAGNOSE] Estado del canal de prueba:', status);
    });
  
  // Limpiar después de 5 segundos
  setTimeout(() => {
    testChannel.unsubscribe();
    console.log('🧹 [DIAGNOSE] Canal de prueba limpiado');
  }, 5000);
  
  return true;
}

// Función para ejecutar diagnóstico completo
async function runFullDiagnosis() {
  console.log('🔍 [DIAGNOSE] Ejecutando diagnóstico completo...');
  
  const results = {
    supabase: diagnoseSupabaseConfig(),
    seatLockStore: diagnoseSeatLockStore(),
    cartStore: diagnoseCartStore(),
    rls: await diagnoseRLS(),
    rpc: await diagnoseRPCFunctions(),
    realtime: diagnoseRealtimeEvents()
  };
  
  console.log('📊 [DIAGNOSE] Resumen del diagnóstico:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  if (allPassed) {
    console.log('✅ [DIAGNOSE] Todos los diagnósticos pasaron');
  } else {
    console.log('❌ [DIAGNOSE] Algunos diagnósticos fallaron');
  }
  
  return results;
}

// Exponer funciones globalmente
window.diagnoseSupabaseConfig = diagnoseSupabaseConfig;
window.diagnoseSeatLockStore = diagnoseSeatLockStore;
window.diagnoseCartStore = diagnoseCartStore;
window.diagnoseRLS = diagnoseRLS;
window.diagnoseRPCFunctions = diagnoseRPCFunctions;
window.diagnoseRealtimeEvents = diagnoseRealtimeEvents;
window.runFullDiagnosis = runFullDiagnosis;

console.log('🔍 [DIAGNOSE] Funciones de diagnóstico disponibles:');
console.log('- diagnoseSupabaseConfig() - Verificar configuración de Supabase');
console.log('- diagnoseSeatLockStore() - Verificar estado del seatLockStore');
console.log('- diagnoseCartStore() - Verificar estado del cartStore');
console.log('- diagnoseRLS() - Verificar configuración de RLS');
console.log('- diagnoseRPCFunctions() - Verificar funciones RPC');
console.log('- diagnoseRealtimeEvents() - Verificar eventos en tiempo real');
console.log('- runFullDiagnosis() - Ejecutar diagnóstico completo');
console.log('');
console.log('Ejemplo de uso:');
console.log('runFullDiagnosis()');
