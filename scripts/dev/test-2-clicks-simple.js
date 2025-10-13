// Script simple para probar que funciona con solo 2 clicks
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Probando sistema de 2 clicks...');

// Función para probar el flujo de 2 clicks
async function test2Clicks() {
  try {
    const { useSeatLockStore } = await import('../src/components/seatLockStore');
    const { useCartStore } = await import('../src/store/cartStore');
    
    console.log('✅ [TEST] Stores importados');
    
    const testSeat = {
      sillaId: 'test_2clicks_123',
      functionId: 1,
      nombre: 'Test Seat',
      precio: 100,
      nombreZona: 'Test Zone'
    };
    
    const cartStore = useCartStore.getState();
    const seatStore = useSeatLockStore.getState();
    
    console.log('🎯 [TEST] Estado inicial:', {
      cartItems: cartStore.items.length,
      seatStates: seatStore.seatStates.size,
      lockedSeats: seatStore.lockedSeats.length
    });
    
    // Click 1: Seleccionar
    console.log('🖱️ [TEST] Click 1: Seleccionando asiento...');
    await cartStore.toggleSeat(testSeat);
    
    const stateAfterClick1 = {
      cartItems: useCartStore.getState().items.length,
      seatStates: useSeatLockStore.getState().seatStates.size,
      lockedSeats: useSeatLockStore.getState().lockedSeats.length,
      isInCart: useCartStore.getState().items.some(item => item.sillaId === testSeat.sillaId)
    };
    console.log('📊 [TEST] Estado después del Click 1:', stateAfterClick1);
    
    // Click 2: Deseleccionar
    console.log('🖱️ [TEST] Click 2: Deseleccionando asiento...');
    await cartStore.toggleSeat(testSeat);
    
    const stateAfterClick2 = {
      cartItems: useCartStore.getState().items.length,
      seatStates: useSeatLockStore.getState().seatStates.size,
      lockedSeats: useSeatLockStore.getState().lockedSeats.length,
      isInCart: useCartStore.getState().items.some(item => item.sillaId === testSeat.sillaId)
    };
    console.log('📊 [TEST] Estado después del Click 2:', stateAfterClick2);
    
    // Verificar que volvió al estado inicial
    const isBackToInitial = 
      stateAfterClick2.cartItems === 0 && 
      stateAfterClick2.lockedSeats === 0 && 
      !stateAfterClick2.isInCart;
    
    if (isBackToInitial) {
      console.log('✅ [TEST] ¡ÉXITO! Sistema funciona con 2 clicks');
    } else {
      console.log('❌ [TEST] ERROR: No volvió al estado inicial');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
}

// Ejecutar prueba
test2Clicks();

console.log('🧪 [TEST] Prueba iniciada. Revisa la consola para los resultados.');
