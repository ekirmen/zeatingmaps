// Script para diagnosticar y corregir problemas de functionId
// Ejecutar en la consola del navegador

console.log('🔍 [FIX_FUNCTIONID] Iniciando diagnóstico de functionId');

// Función para verificar el estado actual del carrito
function checkCartState() {
  console.log('🔍 [FIX_FUNCTIONID] Verificando estado del carrito...');
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [FIX_FUNCTIONID] cartStore no está disponible globalmente');
    return false;
  }
  
  const state = cartStore.getState();
  console.log('📊 [FIX_FUNCTIONID] Estado del carrito:', {
    items: state.items,
    functionId: state.functionId,
    itemsCount: state.items.length,
    cartExpiration: state.cartExpiration
  });
  
  // Verificar si hay items sin functionId
  const itemsWithoutFunctionId = state.items.filter(item => !item.functionId && !item.funcionId);
  if (itemsWithoutFunctionId.length > 0) {
    console.warn('⚠️ [FIX_FUNCTIONID] Items sin functionId:', itemsWithoutFunctionId);
  } else {
    console.log('✅ [FIX_FUNCTIONID] Todos los items tienen functionId');
  }
  
  return true;
}

// Función para verificar el estado del seatLockStore
function checkSeatLockState() {
  console.log('🔍 [FIX_FUNCTIONID] Verificando estado del seatLockStore...');
  
  const seatStore = window.seatLockStore || window.__SEAT_LOCK_STORE__;
  if (!seatStore) {
    console.error('❌ [FIX_FUNCTIONID] seatLockStore no está disponible globalmente');
    return false;
  }
  
  const state = seatStore.getState();
  console.log('📊 [FIX_FUNCTIONID] Estado del seatLockStore:', {
    lockedSeats: state.lockedSeats,
    currentFunctionId: state.currentFunctionId,
    isSubscribed: state.isSubscribed
  });
  
  // Verificar si hay locks sin functionId
  const locksWithoutFunctionId = state.lockedSeats.filter(lock => !lock.funcion_id);
  if (locksWithoutFunctionId.length > 0) {
    console.warn('⚠️ [FIX_FUNCTIONID] Locks sin functionId:', locksWithoutFunctionId);
  } else {
    console.log('✅ [FIX_FUNCTIONID] Todos los locks tienen functionId');
  }
  
  return true;
}

// Función para limpiar items del carrito sin functionId
function cleanCartItemsWithoutFunctionId() {
  console.log('🧹 [FIX_FUNCTIONID] Limpiando items del carrito sin functionId...');
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [FIX_FUNCTIONID] cartStore no está disponible globalmente');
    return false;
  }
  
  const state = cartStore.getState();
  const itemsWithFunctionId = state.items.filter(item => item.functionId || item.funcionId);
  
  if (itemsWithFunctionId.length !== state.items.length) {
    console.log(`🧹 [FIX_FUNCTIONID] Limpiando ${state.items.length - itemsWithFunctionId.length} items sin functionId`);
    cartStore.setState({ items: itemsWithFunctionId });
    console.log('✅ [FIX_FUNCTIONID] Carrito limpiado');
  } else {
    console.log('✅ [FIX_FUNCTIONID] No hay items para limpiar');
  }
  
  return true;
}

// Función para establecer functionId en el carrito
function setCartFunctionId(functionId) {
  console.log(`🔧 [FIX_FUNCTIONID] Estableciendo functionId en carrito: ${functionId}`);
  
  const cartStore = window.cartStore || window.__CART_STORE__;
  if (!cartStore) {
    console.error('❌ [FIX_FUNCTIONID] cartStore no está disponible globalmente');
    return false;
  }
  
  cartStore.setState({ functionId: functionId });
  console.log('✅ [FIX_FUNCTIONID] functionId establecido en carrito');
  return true;
}

// Función para verificar la URL actual y extraer functionId
function extractFunctionIdFromURL() {
  console.log('🔍 [FIX_FUNCTIONID] Extrayendo functionId de la URL...');
  
  const url = window.location.href;
  console.log('📊 [FIX_FUNCTIONID] URL actual:', url);
  
  // Buscar functionId en la URL
  const functionIdMatch = url.match(/functionId[=:]([0-9]+)/i) || url.match(/funcion[=:]([0-9]+)/i);
  
  if (functionIdMatch) {
    const functionId = parseInt(functionIdMatch[1]);
    console.log('✅ [FIX_FUNCTIONID] functionId encontrado en URL:', functionId);
    return functionId;
  } else {
    console.warn('⚠️ [FIX_FUNCTIONID] No se encontró functionId en la URL');
    return null;
  }
}

// Función para verificar el estado de la página actual
function checkPageState() {
  console.log('🔍 [FIX_FUNCTIONID] Verificando estado de la página...');
  
  // Verificar si estamos en una página de evento
  const isEventPage = window.location.pathname.includes('/evento/') || 
                     window.location.pathname.includes('/event/') ||
                     window.location.pathname.includes('/funcion/');
  
  console.log('📊 [FIX_FUNCTIONID] Estado de la página:', {
    isEventPage,
    pathname: window.location.pathname,
    search: window.location.search
  });
  
  return isEventPage;
}

// Función para ejecutar diagnóstico completo
function runFunctionIdDiagnosis() {
  console.log('🔍 [FIX_FUNCTIONID] Ejecutando diagnóstico completo de functionId...');
  
  const results = {
    cartState: checkCartState(),
    seatLockState: checkSeatLockState(),
    pageState: checkPageState(),
    urlFunctionId: extractFunctionIdFromURL()
  };
  
  console.log('📊 [FIX_FUNCTIONID] Resumen del diagnóstico:', results);
  
  // Si hay functionId en la URL pero no en el carrito, establecerlo
  if (results.urlFunctionId && results.cartState) {
    const cartStore = window.cartStore || window.__CART_STORE__;
    if (cartStore) {
      const currentFunctionId = cartStore.getState().functionId;
      if (!currentFunctionId) {
        console.log('🔧 [FIX_FUNCTIONID] Estableciendo functionId desde URL...');
        setCartFunctionId(results.urlFunctionId);
      }
    }
  }
  
  // Limpiar items sin functionId
  if (results.cartState) {
    cleanCartItemsWithoutFunctionId();
  }
  
  return results;
}

// Función para forzar la limpieza de locks sin functionId
async function cleanLocksWithoutFunctionId() {
  console.log('🧹 [FIX_FUNCTIONID] Limpiando locks sin functionId...');
  
  const supabase = window.supabase || window.__SUPABASE__;
  if (!supabase) {
    console.error('❌ [FIX_FUNCTIONID] Supabase no está disponible globalmente');
    return false;
  }
  
  try {
    // Eliminar locks donde funcion_id es null
    const { data, error } = await supabase
      .from('seat_locks')
      .delete()
      .is('funcion_id', null);
    
    if (error) {
      console.error('❌ [FIX_FUNCTIONID] Error limpiando locks:', error);
      return false;
    }
    
    console.log('✅ [FIX_FUNCTIONID] Locks sin functionId limpiados:', data);
    return true;
  } catch (error) {
    console.error('❌ [FIX_FUNCTIONID] Error limpiando locks:', error);
    return false;
  }
}

// Exponer funciones globalmente
window.checkCartState = checkCartState;
window.checkSeatLockState = checkSeatLockState;
window.cleanCartItemsWithoutFunctionId = cleanCartItemsWithoutFunctionId;
window.setCartFunctionId = setCartFunctionId;
window.extractFunctionIdFromURL = extractFunctionIdFromURL;
window.checkPageState = checkPageState;
window.runFunctionIdDiagnosis = runFunctionIdDiagnosis;
window.cleanLocksWithoutFunctionId = cleanLocksWithoutFunctionId;

console.log('🔍 [FIX_FUNCTIONID] Funciones de diagnóstico disponibles:');
console.log('- checkCartState() - Verificar estado del carrito');
console.log('- checkSeatLockState() - Verificar estado del seatLockStore');
console.log('- cleanCartItemsWithoutFunctionId() - Limpiar items sin functionId');
console.log('- setCartFunctionId(functionId) - Establecer functionId en carrito');
console.log('- extractFunctionIdFromURL() - Extraer functionId de la URL');
console.log('- checkPageState() - Verificar estado de la página');
console.log('- runFunctionIdDiagnosis() - Ejecutar diagnóstico completo');
console.log('- cleanLocksWithoutFunctionId() - Limpiar locks sin functionId en BD');
console.log('');
console.log('Ejemplo de uso:');
console.log('runFunctionIdDiagnosis()');
console.log('cleanLocksWithoutFunctionId()');
