// Script para probar la sincronización en tiempo real entre navegadores
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de sincronización en tiempo real');

// Función para monitorear cambios en seatStates
function monitorSeatStates() {
  const seatStore = window.seatLockStore || window.__SEAT_LOCK_STORE__;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  console.log('🔍 [TEST] Monitoreando cambios en seatStates...');
  
  // Suscribirse a cambios en el store
  const unsubscribe = seatStore.subscribe((state) => {
    console.log('📊 [TEST] Estado actualizado:', {
      seatStates: state.seatStates,
      lockedSeats: state.lockedSeats,
      timestamp: new Date().toISOString()
    });
  });
  
  return unsubscribe;
}

// Función para simular selección de asiento
async function testSeatSelection(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Simulando selección de asiento: ${seatId}`);
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [TEST] cartStore no está disponible globalmente');
    return false;
  }
  
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
  
  try {
    await cartStore.getState().toggleSeat(seatToSelect);
    console.log(`✅ [TEST] Asiento ${seatId} seleccionado`);
    return true;
  } catch (error) {
    console.error(`❌ [TEST] Error seleccionando asiento ${seatId}:`, error);
    return false;
  }
}

// Función para simular deselección de asiento
async function testSeatDeselection(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Simulando deselección de asiento: ${seatId}`);
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [TEST] cartStore no está disponible globalmente');
    return false;
  }
  
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
  
  try {
    await cartStore.getState().toggleSeat(seatToDeselect);
    console.log(`✅ [TEST] Asiento ${seatId} deseleccionado`);
    return true;
  } catch (error) {
    console.error(`❌ [TEST] Error deseleccionando asiento ${seatId}:`, error);
    return false;
  }
}

// Función para verificar estado actual
function checkCurrentState() {
  const seatStore = window.seatLockStore || window.__SEAT_LOCK_STORE__;
  const cartStore = window.cartStore || window.__CART_STORE__;
  
  if (!seatStore || !cartStore) {
    console.error('❌ [TEST] Stores no están disponibles globalmente');
    return;
  }
  
  const seatState = seatStore.getState();
  const cartState = cartStore.getState();
  
  console.log('📊 [TEST] Estado actual:', {
    seatStates: seatState.seatStates,
    lockedSeats: seatState.lockedSeats,
    cartItems: cartState.items,
    cartItemsCount: cartState.items.length,
    timestamp: new Date().toISOString()
  });
}

// Función para ejecutar prueba completa de sincronización
async function runSyncTest(seatId, functionId = 43) {
  console.log(`🧪 [TEST] Ejecutando prueba de sincronización para asiento: ${seatId}`);
  
  // Paso 1: Verificar estado inicial
  console.log('📊 [TEST] Estado inicial:');
  checkCurrentState();
  
  // Paso 2: Seleccionar asiento
  console.log('🔄 [TEST] Paso 1: Seleccionando asiento...');
  const selectionResult = await testSeatSelection(seatId, functionId);
  if (!selectionResult) {
    console.error('❌ [TEST] Falló la selección');
    return false;
  }
  
  // Esperar un momento para que se propague
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Paso 3: Verificar estado después de selección
  console.log('📊 [TEST] Estado después de selección:');
  checkCurrentState();
  
  // Paso 4: Deseleccionar asiento
  console.log('🔄 [TEST] Paso 2: Deseleccionando asiento...');
  const deselectionResult = await testSeatDeselection(seatId, functionId);
  if (!deselectionResult) {
    console.error('❌ [TEST] Falló la deselección');
    return false;
  }
  
  // Esperar un momento para que se propague
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Paso 5: Verificar estado final
  console.log('📊 [TEST] Estado final:');
  checkCurrentState();
  
  console.log('✅ [TEST] Prueba de sincronización completada');
  return true;
}

// Función para verificar conexión de Supabase
function checkSupabaseConnection() {
  const seatStore = window.seatLockStore || window.__SEAT_LOCK_STORE__;
  if (!seatStore) {
    console.error('❌ [TEST] seatLockStore no está disponible globalmente');
    return;
  }
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [TEST] Supabase no está disponible globalmente');
    return;
  }
  
  console.log('🔍 [TEST] Verificando conexión de Supabase...');
  console.log('📊 [TEST] Supabase configurado:', {
    url: supabase.supabaseUrl,
    key: supabase.supabaseKey ? 'Configurado' : 'No configurado'
  });
  
  // Verificar si hay canales activos
  const channels = supabase.getChannels();
  console.log('📊 [TEST] Canales activos:', channels.length);
  
  channels.forEach((channel, index) => {
    console.log(`📊 [TEST] Canal ${index + 1}:`, {
      topic: channel.topic,
      status: channel.state
    });
  });
}

// Exponer funciones globalmente
window.monitorSeatStates = monitorSeatStates;
window.testSeatSelection = testSeatSelection;
window.testSeatDeselection = testSeatDeselection;
window.checkCurrentState = checkCurrentState;
window.runSyncTest = runSyncTest;
window.checkSupabaseConnection = checkSupabaseConnection;

console.log('🧪 [TEST] Funciones de prueba disponibles:');
console.log('- monitorSeatStates() - Monitorear cambios en seatStates');
console.log('- testSeatSelection(seatId, functionId) - Simular selección');
console.log('- testSeatDeselection(seatId, functionId) - Simular deselección');
console.log('- checkCurrentState() - Verificar estado actual');
console.log('- runSyncTest(seatId, functionId) - Ejecutar prueba completa');
console.log('- checkSupabaseConnection() - Verificar conexión Supabase');
console.log('');
console.log('Ejemplo de uso:');
console.log('runSyncTest("silla_1757209438389_43", 43)');
console.log('checkSupabaseConnection()');
