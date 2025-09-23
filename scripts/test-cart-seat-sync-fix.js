// Script para probar la sincronización entre carrito y canvas
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización carrito-canvas');

// Función para probar la sincronización
async function testCartSeatSync() {
  try {
    // 1. Verificar que el seatLockStore esté disponible
    if (typeof window.seatLockStore === 'undefined') {
      console.error('❌ [TEST] seatLockStore no está disponible globalmente');
      return;
    }
    
    const seatStore = window.seatLockStore.getState();
    console.log('✅ [TEST] seatLockStore disponible:', seatStore);
    
    // 2. Verificar que el cartStore esté disponible
    if (typeof window.cartStore === 'undefined') {
      console.error('❌ [TEST] cartStore no está disponible globalmente');
      return;
    }
    
    const cartStore = window.cartStore.getState();
    console.log('✅ [TEST] cartStore disponible:', cartStore);
    
    // 3. Simular selección de asiento
    const testSeatId = 'silla_test_123';
    const testSeat = {
      _id: testSeatId,
      nombre: 'Test Seat',
      zona: { nombre: 'Test Zone' },
      precio: 50
    };
    
    console.log('🎯 [TEST] Simulando selección de asiento:', testSeatId);
    
    // Agregar al carrito
    cartStore.toggleSeat(testSeat, 43); // función 43
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verificar que el asiento esté en el carrito
    const cartItems = cartStore.items;
    const seatInCart = cartItems.find(item => (item.sillaId || item.id || item._id) === testSeatId);
    
    if (seatInCart) {
      console.log('✅ [TEST] Asiento agregado al carrito correctamente');
    } else {
      console.error('❌ [TEST] Asiento NO está en el carrito');
    }
    
    // 5. Verificar que el asiento esté en seatStates
    const seatState = seatStore.seatStates.get(testSeatId);
    if (seatState) {
      console.log('✅ [TEST] Asiento tiene estado en seatStates:', seatState);
    } else {
      console.log('ℹ️ [TEST] Asiento no tiene estado en seatStates (normal si no está bloqueado en BD)');
    }
    
    // 6. Simular eliminación del carrito
    console.log('🗑️ [TEST] Simulando eliminación del carrito');
    cartStore.removeFromCart(testSeatId);
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. Verificar que el asiento ya no esté en el carrito
    const cartItemsAfter = cartStore.items;
    const seatInCartAfter = cartItemsAfter.find(item => (item.sillaId || item.id || item._id) === testSeatId);
    
    if (!seatInCartAfter) {
      console.log('✅ [TEST] Asiento eliminado del carrito correctamente');
    } else {
      console.error('❌ [TEST] Asiento AÚN está en el carrito');
    }
    
    // 8. Verificar que el asiento ya no esté en seatStates
    const seatStateAfter = seatStore.seatStates.get(testSeatId);
    if (!seatStateAfter) {
      console.log('✅ [TEST] Asiento eliminado de seatStates correctamente');
    } else {
      console.log('ℹ️ [TEST] Asiento aún tiene estado en seatStates:', seatStateAfter);
    }
    
    console.log('🎉 [TEST] Prueba completada');
    
  } catch (error) {
    console.error('❌ [TEST] Error durante la prueba:', error);
  }
}

// Función para verificar el estado actual
function checkCurrentState() {
  console.log('🔍 [CHECK] Estado actual del sistema:');
  
  if (typeof window.seatLockStore !== 'undefined') {
    const seatStore = window.seatLockStore.getState();
    console.log('📊 [CHECK] seatLockStore:', {
      lockedSeats: seatStore.lockedSeats?.length || 0,
      seatStates: seatStore.seatStates?.size || 0,
      channel: seatStore.channel ? 'conectado' : 'desconectado'
    });
  }
  
  if (typeof window.cartStore !== 'undefined') {
    const cartStore = window.cartStore.getState();
    console.log('🛒 [CHECK] cartStore:', {
      items: cartStore.items?.length || 0,
      functionId: cartStore.functionId
    });
  }
}

// Exponer funciones globalmente
window.testCartSeatSync = testCartSeatSync;
window.checkCurrentState = checkCurrentState;

console.log('🚀 [TEST] Funciones de prueba disponibles:');
console.log('- testCartSeatSync(): Probar sincronización completa');
console.log('- checkCurrentState(): Verificar estado actual');
console.log('');
console.log('💡 [TEST] Ejecuta testCartSeatSync() para comenzar la prueba');
