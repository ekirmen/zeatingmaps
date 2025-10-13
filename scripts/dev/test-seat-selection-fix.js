// Script para probar la corrección de selección de asientos
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de selección de asientos...');

// Función para probar la selección
async function testSeatSelection() {
  try {
    // 1. Verificar que el store esté disponible
    const { useSeatLockStore } = await import('../src/components/seatLockStore');
    const { useCartStore } = await import('../src/store/cartStore');
    
    console.log('✅ [TEST] Stores importados correctamente');
    
    // 2. Obtener estado actual
    const seatStore = useSeatLockStore.getState();
    const cartStore = useCartStore.getState();
    
    console.log('📊 [TEST] Estado actual del seatStore:', {
      lockedSeats: seatStore.lockedSeats.length,
      seatStates: seatStore.seatStates.size,
      channel: !!seatStore.channel
    });
    
    console.log('🛒 [TEST] Estado actual del cartStore:', {
      items: cartStore.items.length,
      functionId: cartStore.functionId
    });
    
    // 3. Simular selección de asiento
    const testSeatId = 'silla_test_123';
    const testFuncionId = 1;
    
    console.log('🎯 [TEST] Simulando selección de asiento:', testSeatId);
    
    // 4. Probar toggleSeat (selección)
    const testSeat = {
      sillaId: testSeatId,
      functionId: testFuncionId,
      nombre: 'Test Seat',
      precio: 100,
      nombreZona: 'Test Zone'
    };
    
    console.log('✅ [TEST] Probando toggleSeat (selección)...');
    await cartStore.toggleSeat(testSeat);
    
    // 5. Verificar estado después de la selección
    const seatState = seatStore.getSeatState(testSeatId);
    const cartItems = useCartStore.getState().items;
    console.log('🎨 [TEST] Estado después de selección:', {
      seatState,
      cartItems: cartItems.length,
      isInCart: cartItems.some(item => item.sillaId === testSeatId)
    });
    
    // 6. Probar toggleSeat (deselección)
    console.log('🔄 [TEST] Probando toggleSeat (deselección)...');
    await cartStore.toggleSeat(testSeat);
    
    // 7. Verificar estado después de la deselección
    const seatStateAfter = seatStore.getSeatState(testSeatId);
    const cartItemsAfter = useCartStore.getState().items;
    console.log('🎨 [TEST] Estado después de deselección:', {
      seatState: seatStateAfter,
      cartItems: cartItemsAfter.length,
      isInCart: cartItemsAfter.some(item => item.sillaId === testSeatId)
    });
    
    console.log('✅ [TEST] Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ [TEST] Error en la prueba:', error);
  }
}

// Función para verificar colores
function testSeatColors() {
  console.log('🎨 [TEST] Verificando colores de asientos...');
  
  const colors = {
    disponible: '#4CAF50',      // Verde
    seleccionado: '#ffd700',    // Amarillo
    seleccionado_por_otro: '#ed8936', // Naranja
    vendido: '#2d3748',         // Negro
    reservado: '#805ad5',       // Púrpura
    anulado: '#e53e3e'          // Rojo
  };
  
  console.log('🎨 [TEST] Colores definidos:', colors);
  
  // Verificar que los colores sean válidos
  Object.entries(colors).forEach(([state, color]) => {
    const isValid = /^#[0-9A-F]{6}$/i.test(color);
    console.log(`🎨 [TEST] ${state}: ${color} - ${isValid ? '✅' : '❌'}`);
  });
}

// Ejecutar pruebas
testSeatSelection();
testSeatColors();

console.log('🧪 [TEST] Todas las pruebas iniciadas. Revisa la consola para los resultados.');
