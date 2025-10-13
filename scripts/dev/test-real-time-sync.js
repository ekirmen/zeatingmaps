// Script para probar la sincronización en tiempo real entre navegadores
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización en tiempo real');

// Función para simular selección de asiento
function testSeatSelection(seatId, functionId = 43) {
  console.log('🧪 [TEST] Simulando selección de asiento:', { seatId, functionId });
  
  // Obtener el store de seat locks
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  // Simular selección
  const result = seatStore.getState().lockSeat(seatId, 'seleccionado', functionId);
  
  console.log('✅ [TEST] Resultado de selección:', result);
  return result;
}

// Función para simular deselección de asiento
function testSeatDeselection(seatId, functionId = 43) {
  console.log('🧪 [TEST] Simulando deselección de asiento:', { seatId, functionId });
  
  // Obtener el store de seat locks
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  // Simular deselección
  const result = seatStore.getState().unlockSeat(seatId, functionId);
  
  console.log('✅ [TEST] Resultado de deselección:', result);
  return result;
}

// Función para verificar estado actual
function checkCurrentState() {
  console.log('📊 [TEST] Verificando estado actual del sistema');
  
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  const state = seatStore.getState();
  
  console.log('📊 [TEST] Estado actual:', {
    lockedSeats: state.lockedSeats,
    seatStates: state.seatStates,
    lockedTables: state.lockedTables
  });
  
  return state;
}

// Función para monitorear cambios en tiempo real
function startRealtimeMonitoring() {
  console.log('🔔 [TEST] Iniciando monitoreo en tiempo real');
  
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  // Suscribirse a cambios
  const unsubscribe = seatStore.subscribe((state) => {
    console.log('🔄 [TEST] Estado actualizado:', {
      lockedSeats: state.lockedSeats,
      seatStates: state.seatStates
    });
  });
  
  console.log('✅ [TEST] Monitoreo iniciado. Usa stopRealtimeMonitoring() para detener.');
  
  // Guardar función de desuscripción
  window.stopRealtimeMonitoring = unsubscribe;
  
  return unsubscribe;
}

// Función para detener el monitoreo
function stopRealtimeMonitoring() {
  if (window.stopRealtimeMonitoring) {
    window.stopRealtimeMonitoring();
    console.log('🛑 [TEST] Monitoreo detenido');
    delete window.stopRealtimeMonitoring;
  } else {
    console.log('⚠️ [TEST] No hay monitoreo activo');
  }
}

// Función para ejecutar prueba completa
function runFullSyncTest(seatId = 'silla_1755825682843_2', functionId = 43) {
  console.log('🚀 [TEST] Ejecutando prueba completa de sincronización');
  console.log('🎯 [TEST] Asiento de prueba:', { seatId, functionId });
  
  // Paso 1: Verificar estado inicial
  console.log('\n📋 [TEST] PASO 1: Verificar estado inicial');
  const initialState = checkCurrentState();
  
  // Paso 2: Iniciar monitoreo
  console.log('\n📋 [TEST] PASO 2: Iniciar monitoreo en tiempo real');
  startRealtimeMonitoring();
  
  // Paso 3: Simular selección
  console.log('\n📋 [TEST] PASO 3: Simular selección de asiento');
  const selectionResult = testSeatSelection(seatId, functionId);
  
  // Esperar un poco
  setTimeout(() => {
    // Paso 4: Verificar estado después de selección
    console.log('\n📋 [TEST] PASO 4: Verificar estado después de selección');
    const afterSelectionState = checkCurrentState();
    
    // Paso 5: Simular deselección
    console.log('\n📋 [TEST] PASO 5: Simular deselección de asiento');
    const deselectionResult = testSeatDeselection(seatId, functionId);
    
    // Esperar un poco
    setTimeout(() => {
      // Paso 6: Verificar estado final
      console.log('\n📋 [TEST] PASO 6: Verificar estado final');
      const finalState = checkCurrentState();
      
      // Paso 7: Detener monitoreo
      console.log('\n📋 [TEST] PASO 7: Detener monitoreo');
      stopRealtimeMonitoring();
      
      // Resultado final
      const testResult = {
        success: true,
        seatId: seatId,
        functionId: functionId,
        initialState: initialState,
        afterSelectionState: afterSelectionState,
        finalState: finalState,
        selectionResult: selectionResult,
        deselectionResult: deselectionResult
      };
      
      console.log('\n🏁 [TEST] RESULTADO FINAL:', testResult);
      
      if (testResult.success) {
        console.log('✅ [TEST] ¡Prueba completada! Revisa los logs para verificar la sincronización.');
      } else {
        console.log('❌ [TEST] Prueba fallida. Revisa los logs para identificar problemas.');
      }
      
      return testResult;
    }, 2000);
  }, 2000);
}

// Exportar funciones para uso manual
window.testSeatSelection = testSeatSelection;
window.testSeatDeselection = testSeatDeselection;
window.checkCurrentState = checkCurrentState;
window.startRealtimeMonitoring = startRealtimeMonitoring;
window.stopRealtimeMonitoring = stopRealtimeMonitoring;
window.runFullSyncTest = runFullSyncTest;

console.log('✅ [TEST] Funciones de prueba cargadas:');
console.log('- testSeatSelection(seatId, functionId)');
console.log('- testSeatDeselection(seatId, functionId)');
console.log('- checkCurrentState()');
console.log('- startRealtimeMonitoring()');
console.log('- stopRealtimeMonitoring()');
console.log('- runFullSyncTest(seatId, functionId)');
console.log('\n🚀 [TEST] Para ejecutar la prueba completa, usa: runFullSyncTest()');
console.log('📋 [TEST] Para monitorear en tiempo real, usa: startRealtimeMonitoring()');
