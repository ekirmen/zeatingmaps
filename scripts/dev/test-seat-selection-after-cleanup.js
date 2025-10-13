// Script para probar la selección de asientos después de la limpieza
// Ejecutar en la consola del navegador después de ejecutar el script de limpieza

console.log('🧪 [TEST] Iniciando prueba de selección de asientos después de limpieza');

// Función para probar selección de asiento
async function testSeatSelection(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Probando selección de asiento: ${seatId}`);
  
  try {
    // Obtener el store de carrito
    const cartStore = window.cartStore || window.__CART_STORE__;
    if (!cartStore) {
      console.error('❌ [TEST] cartStore no está disponible globalmente');
      return false;
    }
    
    // Crear objeto de asiento simulado
    const seatToSelect = {
      _id: seatId,
      sillaId: seatId,
      id: seatId,
      zonaId: 'zona_test',
      precio: 100,
      nombre: seatId,
      nombreZona: 'Zona Test',
      functionId: functionId,
      funcionId: functionId
    };
    
    // Intentar seleccionar el asiento
    console.log(`🧪 [TEST] Intentando seleccionar asiento ${seatId}...`);
    await cartStore.getState().toggleSeat(seatToSelect);
    
    // Verificar si se añadió al carrito
    const cartItems = cartStore.getState().items;
    const isInCart = cartItems.some(item => (item._id || item.id || item.sillaId) === seatId);
    
    if (isInCart) {
      console.log(`✅ [TEST] Asiento ${seatId} se añadió correctamente al carrito`);
      return true;
    } else {
      console.error(`❌ [TEST] Asiento ${seatId} NO se añadió al carrito`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ [TEST] Error seleccionando asiento ${seatId}:`, error);
    return false;
  }
}

// Función para probar deselección de asiento
async function testSeatDeselection(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Probando deselección de asiento: ${seatId}`);
  
  try {
    // Obtener el store de carrito
    const cartStore = window.cartStore || window.__CART_STORE__;
    if (!cartStore) {
      console.error('❌ [TEST] cartStore no está disponible globalmente');
      return false;
    }
    
    // Crear objeto de asiento simulado
    const seatToDeselect = {
      _id: seatId,
      sillaId: seatId,
      id: seatId,
      zonaId: 'zona_test',
      precio: 100,
      nombre: seatId,
      nombreZona: 'Zona Test',
      functionId: functionId,
      funcionId: functionId
    };
    
    // Intentar deseleccionar el asiento
    console.log(`🧪 [TEST] Intentando deseleccionar asiento ${seatId}...`);
    await cartStore.getState().toggleSeat(seatToDeselect);
    
    // Verificar si se removió del carrito
    const cartItems = cartStore.getState().items;
    const isInCart = cartItems.some(item => (item._id || item.id || item.sillaId) === seatId);
    
    if (!isInCart) {
      console.log(`✅ [TEST] Asiento ${seatId} se removió correctamente del carrito`);
      return true;
    } else {
      console.error(`❌ [TEST] Asiento ${seatId} NO se removió del carrito`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ [TEST] Error deseleccionando asiento ${seatId}:`, error);
    return false;
  }
}

// Función para ejecutar prueba completa
async function runCompleteTest(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Ejecutando prueba completa para asiento: ${seatId}`);
  
  // Paso 1: Seleccionar asiento
  const selectionResult = await testSeatSelection(seatId, functionId);
  if (!selectionResult) {
    console.error('❌ [TEST] Prueba falló en la selección');
    return false;
  }
  
  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Paso 2: Deseleccionar asiento
  const deselectionResult = await testSeatDeselection(seatId, functionId);
  if (!deselectionResult) {
    console.error('❌ [TEST] Prueba falló en la deselección');
    return false;
  }
  
  console.log(`✅ [TEST] Prueba completa exitosa para asiento: ${seatId}`);
  return true;
}

// Función para verificar estado del carrito
function checkCartState() {
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [TEST] cartStore no está disponible globalmente');
    return;
  }
  
  const state = cartStore.getState();
  console.log('🛒 [TEST] Estado actual del carrito:', {
    items: state.items,
    itemsCount: state.items.length,
    functionId: state.functionId,
    timeLeft: state.timeLeft
  });
}

// Exponer funciones globalmente para uso en consola
window.testSeatSelection = testSeatSelection;
window.testSeatDeselection = testSeatDeselection;
window.runCompleteTest = runCompleteTest;
window.checkCartState = checkCartState;

console.log('🧪 [TEST] Funciones de prueba disponibles:');
console.log('- testSeatSelection(seatId, functionId)');
console.log('- testSeatDeselection(seatId, functionId)');
console.log('- runCompleteTest(seatId, functionId)');
console.log('- checkCartState()');
console.log('');
console.log('Ejemplo de uso:');
console.log('runCompleteTest("silla_1755825682843_6", 43)');
