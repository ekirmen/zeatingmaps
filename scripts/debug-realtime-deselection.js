// Script para debuggear la deselección en tiempo real
// Ejecutar en la consola del navegador

console.log('🔍 [DEBUG] Iniciando debug de deselección en tiempo real...');

// 1. Verificar que el store está disponible
if (typeof window.seatLockStore === 'undefined') {
  console.error('❌ [DEBUG] seatLockStore NO está disponible');
  return;
}

console.log('✅ [DEBUG] seatLockStore está disponible');

// 2. Función para monitorear eventos en tiempo real
function monitorRealtimeEvents() {
  const store = window.seatLockStore.getState();
  
  if (store.channel) {
    console.log('🔔 [DEBUG] Canal activo:', store.channel.topic);
    
    // Agregar listener personalizado para debuggear
    store.channel.on('postgres_changes', (payload) => {
      console.log('🔔 [DEBUG] Evento recibido:', {
        eventType: payload.eventType,
        table: payload.table,
        schema: payload.schema,
        new: payload.new,
        old: payload.old
      });
      
      if (payload.table === 'seat_locks' && payload.eventType === 'DELETE') {
        console.log('🗑️ [DEBUG] Evento DELETE detectado para seat_locks:', payload.old);
      }
    });
    
    console.log('👂 [DEBUG] Listener de debug agregado al canal');
  } else {
    console.log('❌ [DEBUG] No hay canal activo');
  }
}

// 3. Función para simular deselección y monitorear
async function simulateDeselectionAndMonitor(seatId, funcionId) {
  console.log(`\n🧪 [DEBUG] Simulando deselección de: ${seatId}`);
  
  // Estado inicial
  console.log('📊 [DEBUG] Estado inicial:');
  const store = window.seatLockStore.getState();
  const initialState = store.seatStates?.get(seatId);
  console.log(`  - Estado inicial: ${initialState || 'disponible'}`);
  
  // Simular deselección
  console.log('🔄 [DEBUG] Ejecutando unlockSeat...');
  const result = await store.unlockSeat(seatId, funcionId);
  console.log(`  - Resultado unlockSeat: ${result}`);
  
  // Monitorear cambios
  let changeDetected = false;
  const checkInterval = setInterval(() => {
    const currentState = store.seatStates?.get(seatId);
    if (currentState !== initialState) {
      console.log(`✅ [DEBUG] Cambio detectado: ${initialState} → ${currentState || 'disponible'}`);
      changeDetected = true;
      clearInterval(checkInterval);
    }
  }, 500);
  
  // Timeout después de 5 segundos
  setTimeout(() => {
    if (!changeDetected) {
      console.log('⏰ [DEBUG] Timeout: No se detectó cambio en 5 segundos');
      clearInterval(checkInterval);
    }
  }, 5000);
}

// 4. Función para verificar el estado del canal
function checkChannelStatus() {
  const store = window.seatLockStore.getState();
  
  console.log('📡 [DEBUG] Estado del canal:');
  console.log('  - Canal existe:', !!store.channel);
  if (store.channel) {
    console.log('  - Topic:', store.channel.topic);
    console.log('  - Estado:', store.channel.state);
    console.log('  - Suscripciones:', store.channel.subscriptions?.length || 0);
  }
}

// 5. Función para verificar la suscripción a seat_locks
function checkSeatLocksSubscription() {
  const store = window.seatLockStore.getState();
  
  if (store.channel) {
    console.log('🔍 [DEBUG] Verificando suscripción a seat_locks...');
    
    // Verificar si hay suscripciones activas
    const subscriptions = store.channel.subscriptions || [];
    const seatLocksSub = subscriptions.find(sub => 
      sub.table === 'seat_locks' && sub.schema === 'public'
    );
    
    if (seatLocksSub) {
      console.log('✅ [DEBUG] Suscripción a seat_locks encontrada:', seatLocksSub);
    } else {
      console.log('❌ [DEBUG] NO se encontró suscripción a seat_locks');
    }
  }
}

// 6. Función para forzar reconexión del canal
function forceReconnect() {
  console.log('🔄 [DEBUG] Forzando reconexión del canal...');
  
  const store = window.seatLockStore.getState();
  
  if (store.channel) {
    // Desuscribirse del canal actual
    store.channel.unsubscribe();
    console.log('  - Canal desuscrito');
  }
  
  // Limpiar estado
  store.unsubscribe();
  console.log('  - Estado limpiado');
  
  // Re-suscribirse
  setTimeout(() => {
    const funcionId = 43; // Cambiar por el ID de función actual
    store.subscribeToFunction(funcionId);
    console.log('  - Re-suscripción iniciada');
  }, 1000);
}

// Ejecutar verificaciones iniciales
monitorRealtimeEvents();
checkChannelStatus();
checkSeatLocksSubscription();

// Exponer funciones para uso manual
window.debugRealtime = {
  monitorRealtimeEvents,
  simulateDeselectionAndMonitor,
  checkChannelStatus,
  checkSeatLocksSubscription,
  forceReconnect
};

console.log('\n🔧 [DEBUG] Funciones de debug expuestas en window.debugRealtime');
console.log('🔧 [DEBUG] Usa window.debugRealtime.simulateDeselectionAndMonitor("silla_1757209438389_41", 43) para probar');
