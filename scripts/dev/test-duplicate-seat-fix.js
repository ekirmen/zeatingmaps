// Script para probar la corrección de errores de duplicación de asientos
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de corrección de duplicación...');

// Función para probar la selección sin duplicación
async function testSeatSelectionNoDuplication() {
  try {
    // 1. Verificar que el store esté disponible
    const { useSeatLockStore } = await import('../src/components/seatLockStore');
    const { useCartStore } = await import('../src/store/cartStore');
    
    console.log('✅ [TEST] Stores importados correctamente');
    
    // 2. Obtener estado actual
    const seatStore = useSeatLockStore.getState();
    const cartStore = useCartStore.getState();
    
    console.log('📊 [TEST] Estado inicial:', {
      lockedSeats: seatStore.lockedSeats.length,
      seatStates: seatStore.seatStates.size,
      cartItems: cartStore.items.length
    });
    
    // 3. Simular selección de asiento
    const testSeatId = 'silla_test_duplicate_123';
    const testFuncionId = 1;
    
    console.log('🎯 [TEST] Probando selección sin duplicación:', testSeatId);
    
    const testSeat = {
      sillaId: testSeatId,
      functionId: testFuncionId,
      nombre: 'Test Seat',
      precio: 100,
      nombreZona: 'Test Zone'
    };
    
    // 4. Primera selección
    console.log('✅ [TEST] Primera selección...');
    await cartStore.toggleSeat(testSeat);
    
    // Verificar estado después de la primera selección
    const stateAfterFirst = {
      lockedSeats: useSeatLockStore.getState().lockedSeats.length,
      seatStates: useSeatLockStore.getState().seatStates.size,
      cartItems: useCartStore.getState().items.length,
      isInCart: useCartStore.getState().items.some(item => item.sillaId === testSeatId)
    };
    console.log('📊 [TEST] Estado después de primera selección:', stateAfterFirst);
    
    // 5. Segunda selección (debería deseleccionar)
    console.log('🔄 [TEST] Segunda selección (deselección)...');
    await cartStore.toggleSeat(testSeat);
    
    // Verificar estado después de la segunda selección
    const stateAfterSecond = {
      lockedSeats: useSeatLockStore.getState().lockedSeats.length,
      seatStates: useSeatLockStore.getState().seatStates.size,
      cartItems: useCartStore.getState().items.length,
      isInCart: useCartStore.getState().items.some(item => item.sillaId === testSeatId)
    };
    console.log('📊 [TEST] Estado después de segunda selección:', stateAfterSecond);
    
    // 6. Tercera selección (debería seleccionar nuevamente)
    console.log('✅ [TEST] Tercera selección...');
    await cartStore.toggleSeat(testSeat);
    
    // Verificar estado después de la tercera selección
    const stateAfterThird = {
      lockedSeats: useSeatLockStore.getState().lockedSeats.length,
      seatStates: useSeatLockStore.getState().seatStates.size,
      cartItems: useCartStore.getState().items.length,
      isInCart: useCartStore.getState().items.some(item => item.sillaId === testSeatId)
    };
    console.log('📊 [TEST] Estado después de tercera selección:', stateAfterThird);
    
    // 7. Verificar que no hay duplicados
    const finalLockedSeats = useSeatLockStore.getState().lockedSeats;
    const duplicates = finalLockedSeats.filter(lock => lock.seat_id === testSeatId);
    
    if (duplicates.length > 1) {
      console.error('❌ [TEST] ERROR: Se encontraron duplicados:', duplicates);
    } else {
      console.log('✅ [TEST] No se encontraron duplicados');
    }
    
    console.log('✅ [TEST] Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ [TEST] Error en la prueba:', error);
  }
}

// Función para verificar el estado de la base de datos
async function checkDatabaseState() {
  try {
    console.log('🔍 [TEST] Verificando estado de la base de datos...');
    
    const { supabase } = await import('../src/supabaseClient');
    
    // Verificar asientos bloqueados en la BD
    const { data: seatLocks, error } = await supabase
      .from('seat_locks')
      .select('*')
      .eq('status', 'seleccionado');
    
    if (error) {
      console.error('❌ [TEST] Error consultando BD:', error);
      return;
    }
    
    console.log('📊 [TEST] Asientos bloqueados en BD:', seatLocks.length);
    
    // Verificar duplicados en BD
    const seatIds = seatLocks.map(lock => lock.seat_id);
    const duplicates = seatIds.filter((id, index) => seatIds.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      console.error('❌ [TEST] ERROR: Duplicados encontrados en BD:', duplicates);
    } else {
      console.log('✅ [TEST] No hay duplicados en la BD');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error verificando BD:', error);
  }
}

// Ejecutar pruebas
testSeatSelectionNoDuplication();
checkDatabaseState();

console.log('🧪 [TEST] Todas las pruebas iniciadas. Revisa la consola para los resultados.');
