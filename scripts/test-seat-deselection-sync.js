// Script para probar la sincronización de deselección de asientos
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización de deselección...');

// 1. Verificar que el store está disponible
if (typeof window.seatLockStore === 'undefined') {
  console.error('❌ [TEST] seatLockStore NO está disponible');
  return;
}

console.log('✅ [TEST] seatLockStore está disponible');

// 2. Función para monitorear cambios en seatStates
function monitorSeatStates() {
  const store = window.seatLockStore.getState();
  
  console.log('📊 [TEST] Estado actual del store:');
  console.log('  - lockedSeats:', store.lockedSeats?.length || 0);
  console.log('  - seatStates size:', store.seatStates?.size || 0);
  console.log('  - channel:', store.channel ? 'Conectado' : 'Desconectado');
  
  if (store.seatStates && store.seatStates.size > 0) {
    console.log('🎨 [TEST] Estados de asientos actuales:');
    store.seatStates.forEach((state, seatId) => {
      console.log(`  - ${seatId}: ${state}`);
    });
  } else {
    console.log('ℹ️ [TEST] No hay estados de asientos en el store');
  }
}

// 3. Función para simular deselección de asiento
async function simulateSeatDeselection(seatId, funcionId) {
  console.log(`🧪 [TEST] Simulando deselección del asiento: ${seatId}`);
  
  try {
    const store = window.seatLockStore.getState();
    const result = await store.unlockSeat(seatId, funcionId);
    
    console.log(`✅ [TEST] Resultado de unlockSeat: ${result}`);
    
    // Esperar un momento para que se procese el cambio
    setTimeout(() => {
      console.log('🔄 [TEST] Verificando estado después de deselección...');
      monitorSeatStates();
    }, 1000);
    
  } catch (error) {
    console.error('❌ [TEST] Error en simulateSeatDeselection:', error);
  }
}

// 4. Función para verificar si un asiento específico está en el store
function checkSeatInStore(seatId) {
  const store = window.seatLockStore.getState();
  
  if (store.seatStates && store.seatStates.has(seatId)) {
    const state = store.seatStates.get(seatId);
    console.log(`🎯 [TEST] Asiento ${seatId} encontrado en store con estado: ${state}`);
    return true;
  } else {
    console.log(`ℹ️ [TEST] Asiento ${seatId} NO encontrado en store (disponible)`);
    return false;
  }
}

// 5. Función para verificar si un asiento está bloqueado
function checkSeatLocked(seatId) {
  const store = window.seatLockStore.getState();
  
  if (store.lockedSeats && store.lockedSeats.length > 0) {
    const lock = store.lockedSeats.find(lock => lock.seat_id === seatId);
    if (lock) {
      console.log(`🔒 [TEST] Asiento ${seatId} está bloqueado:`, lock);
      return true;
    }
  }
  
  console.log(`ℹ️ [TEST] Asiento ${seatId} NO está bloqueado`);
  return false;
}

// 6. Función para probar la sincronización completa
async function testFullSynchronization() {
  console.log('🧪 [TEST] Iniciando prueba de sincronización completa...');
  
  // Estado inicial
  console.log('📊 [TEST] Estado inicial:');
  monitorSeatStates();
  
  // Verificar asiento específico
  const testSeatId = 'silla_1757209438389_41';
  const testFuncionId = 43;
  
  console.log(`\n🎯 [TEST] Verificando asiento específico: ${testSeatId}`);
  const isInStore = checkSeatInStore(testSeatId);
  const isLocked = checkSeatLocked(testSeatId);
  
  if (isInStore || isLocked) {
    console.log('🧪 [TEST] Asiento está en el store, probando deselección...');
    await simulateSeatDeselection(testSeatId, testFuncionId);
  } else {
    console.log('ℹ️ [TEST] Asiento no está en el store, no se puede probar deselección');
  }
}

// Ejecutar las pruebas
testFullSynchronization();

// Exponer funciones para uso manual
window.testSeatSync = {
  monitorSeatStates,
  simulateSeatDeselection,
  checkSeatInStore,
  checkSeatLocked,
  testFullSynchronization
};

console.log('🧪 [TEST] Funciones de prueba expuestas en window.testSeatSync');
console.log('🧪 [TEST] Usa window.testSeatSync.monitorSeatStates() para monitorear cambios');
