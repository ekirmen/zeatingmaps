// Script para probar la sincronización entre canvas y carrito
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización canvas-carrito...');

// 1. Verificar que los stores están disponibles
if (typeof window.seatLockStore === 'undefined') {
  console.error('❌ [TEST] seatLockStore NO está disponible');
  return;
}

if (typeof window.cartStore === 'undefined') {
  console.error('❌ [TEST] cartStore NO está disponible');
  return;
}

console.log('✅ [TEST] Ambos stores están disponibles');

// 2. Función para verificar el estado del carrito
function checkCartState() {
  const cartStore = window.cartStore.getState();
  
  console.log('🛒 [TEST] Estado del carrito:');
  console.log('  - Items:', cartStore.items?.length || 0);
  console.log('  - Function ID:', cartStore.functionId);
  console.log('  - Tiempo restante:', cartStore.timeLeft);
  
  if (cartStore.items && cartStore.items.length > 0) {
    console.log('  - Asientos en carrito:');
    cartStore.items.forEach((item, index) => {
      console.log(`    ${index + 1}. ${item.sillaId || item.id || item._id} - ${item.nombre || 'Sin nombre'}`);
    });
  }
}

// 3. Función para verificar el estado del seatLockStore
function checkSeatLockState() {
  const seatStore = window.seatLockStore.getState();
  
  console.log('🔒 [TEST] Estado del seatLockStore:');
  console.log('  - Locked seats:', seatStore.lockedSeats?.length || 0);
  console.log('  - Seat states:', seatStore.seatStates?.size || 0);
  console.log('  - Channel:', seatStore.channel ? 'Conectado' : 'Desconectado');
  
  if (seatStore.seatStates && seatStore.seatStates.size > 0) {
    console.log('  - Estados de asientos:');
    seatStore.seatStates.forEach((state, seatId) => {
      console.log(`    - ${seatId}: ${state}`);
    });
  }
}

// 4. Función para verificar la sincronización
function checkSynchronization() {
  console.log('\n🔄 [TEST] Verificando sincronización...');
  
  const cartStore = window.cartStore.getState();
  const seatStore = window.seatLockStore.getState();
  
  // Obtener asientos del carrito
  const cartSeatIds = cartStore.items?.map(item => (item.sillaId || item.id || item._id)?.toString()).filter(Boolean) || [];
  
  // Obtener asientos bloqueados
  const lockedSeatIds = seatStore.lockedSeats?.map(lock => lock.seat_id?.toString()).filter(Boolean) || [];
  
  // Obtener asientos con estado
  const stateSeatIds = seatStore.seatStates ? Array.from(seatStore.seatStates.keys()) : [];
  
  console.log('📊 [TEST] Comparación de estados:');
  console.log('  - Carrito:', cartSeatIds);
  console.log('  - Locked seats:', lockedSeatIds);
  console.log('  - Seat states:', stateSeatIds);
  
  // Verificar inconsistencias
  const cartNotLocked = cartSeatIds.filter(id => !lockedSeatIds.includes(id));
  const lockedNotCart = lockedSeatIds.filter(id => !cartSeatIds.includes(id));
  
  if (cartNotLocked.length > 0) {
    console.log('⚠️ [TEST] Asientos en carrito pero NO bloqueados:', cartNotLocked);
  }
  
  if (lockedNotCart.length > 0) {
    console.log('⚠️ [TEST] Asientos bloqueados pero NO en carrito:', lockedNotCart);
  }
  
  if (cartNotLocked.length === 0 && lockedNotCart.length === 0) {
    console.log('✅ [TEST] Sincronización perfecta entre carrito y seatLockStore');
  }
}

// 5. Función para simular deselección desde carrito
async function simulateCartDeselection(seatId) {
  console.log(`\n🧪 [TEST] Simulando deselección desde carrito: ${seatId}`);
  
  const cartStore = window.cartStore.getState();
  const seatStore = window.seatLockStore.getState();
  
  // Estado inicial
  console.log('📊 [TEST] Estado inicial:');
  checkCartState();
  checkSeatLockState();
  
  // Simular deselección
  try {
    const result = await cartStore.toggleSeat({ sillaId: seatId });
    console.log(`✅ [TEST] toggleSeat resultado: ${result}`);
    
    // Esperar un momento para que se procese
    setTimeout(() => {
      console.log('\n📊 [TEST] Estado después de deselección:');
      checkCartState();
      checkSeatLockState();
      checkSynchronization();
    }, 1000);
    
  } catch (error) {
    console.error('❌ [TEST] Error en simulateCartDeselection:', error);
  }
}

// 6. Función para simular deselección desde seatLockStore
async function simulateSeatLockDeselection(seatId, funcionId) {
  console.log(`\n🧪 [TEST] Simulando deselección desde seatLockStore: ${seatId}`);
  
  const seatStore = window.seatLockStore.getState();
  
  // Estado inicial
  console.log('📊 [TEST] Estado inicial:');
  checkCartState();
  checkSeatLockState();
  
  // Simular deselección
  try {
    const result = await seatStore.unlockSeat(seatId, funcionId);
    console.log(`✅ [TEST] unlockSeat resultado: ${result}`);
    
    // Esperar un momento para que se procese
    setTimeout(() => {
      console.log('\n📊 [TEST] Estado después de deselección:');
      checkCartState();
      checkSeatLockState();
      checkSynchronization();
    }, 1000);
    
  } catch (error) {
    console.error('❌ [TEST] Error en simulateSeatLockDeselection:', error);
  }
}

// 7. Función para monitorear cambios en tiempo real
function monitorChanges() {
  console.log('\n👂 [TEST] Monitoreando cambios en tiempo real...');
  
  // Monitorear cambios en el carrito
  const cartStore = window.cartStore.getState();
  if (cartStore.subscribe) {
    cartStore.subscribe((state) => {
      console.log('🛒 [TEST] Cambio en carrito:', {
        items: state.items?.length || 0,
        functionId: state.functionId
      });
    });
  }
  
  // Monitorear cambios en seatLockStore
  const seatStore = window.seatLockStore.getState();
  if (seatStore.subscribe) {
    seatStore.subscribe((state) => {
      console.log('🔒 [TEST] Cambio en seatLockStore:', {
        lockedSeats: state.lockedSeats?.length || 0,
        seatStates: state.seatStates?.size || 0
      });
    });
  }
}

// Ejecutar verificaciones iniciales
checkCartState();
checkSeatLockState();
checkSynchronization();
monitorChanges();

// Exponer funciones para uso manual
window.testSeatCartSync = {
  checkCartState,
  checkSeatLockState,
  checkSynchronization,
  simulateCartDeselection,
  simulateSeatLockDeselection,
  monitorChanges
};

console.log('\n🔧 [TEST] Funciones de prueba expuestas en window.testSeatCartSync');
console.log('🔧 [TEST] Usa window.testSeatCartSync.checkSynchronization() para verificar sincronización');
