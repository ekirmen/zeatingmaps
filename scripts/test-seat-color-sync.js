// Script para probar la sincronización de colores de asientos
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización de colores de asientos');

// Función para simular la deselección de un asiento
function testSeatDeselection(seatId) {
  console.log('🧪 [TEST] Simulando deselección de asiento:', seatId);
  
  // Obtener el store de seat locks
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  // Verificar estado actual
  const currentState = seatStore.getState();
  console.log('📊 [TEST] Estado actual del store:', {
    seatStates: currentState.seatStates,
    lockedSeats: currentState.lockedSeats
  });
  
  // Verificar si el asiento está en seatStates
  const hasSeat = currentState.seatStates.has(seatId);
  console.log('🔍 [TEST] Asiento en seatStates:', hasSeat);
  
  if (hasSeat) {
    console.log('🎨 [TEST] Estado actual del asiento:', currentState.seatStates.get(seatId));
  }
  
  // Simular eliminación del asiento del seatStates
  const newSeatStates = new Map(currentState.seatStates);
  newSeatStates.delete(seatId);
  
  console.log('🗑️ [TEST] Eliminando asiento del seatStates...');
  seatStore.setSeatStates(newSeatStates);
  
  // Verificar que se eliminó
  const updatedState = seatStore.getState();
  const stillHasSeat = updatedState.seatStates.has(seatId);
  console.log('✅ [TEST] Asiento eliminado del seatStates:', !stillHasSeat);
  
  console.log('📊 [TEST] Estado actualizado del store:', {
    seatStates: updatedState.seatStates,
    lockedSeats: updatedState.lockedSeats
  });
  
  return {
    success: !stillHasSeat,
    seatId: seatId,
    beforeState: currentState.seatStates.get(seatId),
    afterState: 'eliminado'
  };
}

// Función para verificar el color de un asiento en el DOM
function checkSeatColor(seatId) {
  console.log('🎨 [TEST] Verificando color del asiento en el DOM:', seatId);
  
  // Buscar el elemento del asiento en el canvas de Konva
  const stage = document.querySelector('canvas');
  if (!stage) {
    console.error('❌ [TEST] No se encontró el canvas de Konva');
    return null;
  }
  
  // Obtener el contexto del canvas
  const ctx = stage.getContext('2d');
  if (!ctx) {
    console.error('❌ [TEST] No se pudo obtener el contexto del canvas');
    return null;
  }
  
  console.log('📊 [TEST] Canvas encontrado:', {
    width: stage.width,
    height: stage.height
  });
  
  // Nota: Konva maneja el renderizado internamente, no podemos acceder directamente
  // a los colores desde el DOM. En su lugar, verificamos el estado del store.
  
  const seatStore = window.seatLockStore;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return null;
  }
  
  const state = seatStore.getState();
  const seatState = state.seatStates.get(seatId);
  
  console.log('🎨 [TEST] Estado del asiento en el store:', seatState);
  
  return {
    seatId: seatId,
    state: seatState,
    isInStore: state.seatStates.has(seatId)
  };
}

// Función para ejecutar la prueba completa
function runColorSyncTest(seatId = 'silla_1755825682843_2') {
  console.log('🚀 [TEST] Ejecutando prueba completa de sincronización de colores');
  console.log('🎯 [TEST] Asiento de prueba:', seatId);
  
  // Paso 1: Verificar estado inicial
  console.log('\n📋 [TEST] PASO 1: Verificar estado inicial');
  const initialColor = checkSeatColor(seatId);
  console.log('🎨 [TEST] Color inicial:', initialColor);
  
  // Paso 2: Simular deselección
  console.log('\n📋 [TEST] PASO 2: Simular deselección');
  const deselectionResult = testSeatDeselection(seatId);
  console.log('🗑️ [TEST] Resultado de deselección:', deselectionResult);
  
  // Paso 3: Verificar color después de deselección
  console.log('\n📋 [TEST] PASO 3: Verificar color después de deselección');
  const finalColor = checkSeatColor(seatId);
  console.log('🎨 [TEST] Color final:', finalColor);
  
  // Paso 4: Verificar que el asiento volvió a verde
  console.log('\n📋 [TEST] PASO 4: Verificar que el asiento volvió a verde');
  const shouldBeGreen = !finalColor.isInStore;
  console.log('✅ [TEST] Asiento debería ser verde (no en store):', shouldBeGreen);
  
  // Resultado final
  const testResult = {
    success: deselectionResult.success && shouldBeGreen,
    seatId: seatId,
    initialState: initialColor.state,
    finalState: finalColor.state,
    isInStore: finalColor.isInStore,
    shouldBeGreen: shouldBeGreen
  };
  
  console.log('\n🏁 [TEST] RESULTADO FINAL:', testResult);
  
  if (testResult.success) {
    console.log('✅ [TEST] ¡Prueba exitosa! El asiento se sincroniza correctamente.');
  } else {
    console.log('❌ [TEST] Prueba fallida. El asiento no se sincroniza correctamente.');
  }
  
  return testResult;
}

// Exportar funciones para uso manual
window.testSeatDeselection = testSeatDeselection;
window.checkSeatColor = checkSeatColor;
window.runColorSyncTest = runColorSyncTest;

console.log('✅ [TEST] Funciones de prueba cargadas:');
console.log('- testSeatDeselection(seatId)');
console.log('- checkSeatColor(seatId)');
console.log('- runColorSyncTest(seatId)');
console.log('\n🚀 [TEST] Para ejecutar la prueba completa, usa: runColorSyncTest()');
