// Script para arreglar la sincronización entre carrito y seat locks
// Ejecutar en la consola del navegador

console.log('🔧 Iniciando fix de sincronización carrito-seat locks...');

// 1. Limpiar localStorage desincronizado
function clearDesynchronizedState() {
  console.log('🧹 Limpiando estado desincronizado...');
  
  // Limpiar carrito y asientos seleccionados
  localStorage.removeItem('cart-storage');
  localStorage.removeItem('selectedSeats');
  localStorage.removeItem('selected-seats-storage');
  localStorage.removeItem('boleteriaCart');
  
  // Mantener solo el sessionId
  const sessionId = localStorage.getItem('anonSessionId');
  
  console.log('✅ Estado limpiado. SessionId preservado:', sessionId);
  return sessionId;
}

// 2. Verificar estado actual
function checkCurrentState() {
  console.log('🔍 Verificando estado actual...');
  
  // Verificar seatLockStore
  const seatLockState = window.seatLockStore?.getState?.();
  console.log('SeatLockStore state:', seatLockState);
  
  // Verificar localStorage
  const cartStorage = localStorage.getItem('cart-storage');
  const selectedSeats = localStorage.getItem('selectedSeats');
  
  console.log('Cart storage exists:', !!cartStorage);
  console.log('Selected seats exists:', !!selectedSeats);
  
  return {
    seatLockState,
    hasCartStorage: !!cartStorage,
    hasSelectedSeats: !!selectedSeats
  };
}

// 3. Sincronizar estado
function synchronizeState() {
  console.log('🔄 Sincronizando estado...');
  
  const sessionId = localStorage.getItem('anonSessionId');
  if (!sessionId) {
    console.error('❌ No hay sessionId disponible');
    return false;
  }
  
  // Verificar si hay asientos bloqueados en la BD
  fetch('/api/check-seat-locks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: sessionId,
      funcionId: 43
    })
  }).then(response => response.json())
  .then(data => {
    console.log('Asientos bloqueados en BD:', data);
    
    if (data.lockedSeats && data.lockedSeats.length > 0) {
      // Sincronizar con el estado local
      if (window.seatLockStore) {
        window.seatLockStore.getState().setLockedSeats(data.lockedSeats);
        console.log('✅ Estado sincronizado con BD');
      }
    }
  })
  .catch(error => {
    console.log('⚠️ No se pudo verificar BD, continuando con estado local');
  });
  
  return true;
}

// 4. Función principal
function fixCartSeatSync() {
  console.log('🚀 Iniciando fix completo...');
  
  // Paso 1: Verificar estado actual
  checkCurrentState();
  
  // Paso 2: Limpiar estado desincronizado
  clearDesynchronizedState();
  
  // Paso 3: Sincronizar estado
  const syncResult = synchronizeState();
  
  if (syncResult) {
    console.log('✅ Fix completado exitosamente');
    console.log('🔄 Recargando página para aplicar cambios...');
    
    // Recargar página después de 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    console.error('❌ Error en el fix');
  }
}

// 5. Función para probar selección de asientos
function testSeatSelection() {
  console.log('🧪 Probando selección de asientos...');
  
  // Simular click en una silla
  const seatElement = document.querySelector('[data-seat-id]');
  if (seatElement) {
    console.log('🎯 Encontrada silla para probar:', seatElement.dataset.seatId);
    seatElement.click();
  } else {
    console.log('⚠️ No se encontraron sillas en el DOM');
  }
}

// 6. Función para verificar carrito después del fix
function verifyCartAfterFix() {
  console.log('🔍 Verificando carrito después del fix...');
  
  setTimeout(() => {
    const cartStorage = localStorage.getItem('cart-storage');
    const seatLockState = window.seatLockStore?.getState?.();
    
    console.log('Cart storage after fix:', cartStorage ? 'EXISTS' : 'EMPTY');
    console.log('SeatLockStore after fix:', seatLockState?.lockedSeats?.length || 0, 'asientos bloqueados');
    
    if (cartStorage) {
      try {
        const cartData = JSON.parse(cartStorage);
        console.log('Items en carrito:', cartData.state?.items?.length || 0);
      } catch (e) {
        console.error('Error parsing cart:', e);
      }
    }
  }, 3000);
}

// Ejecutar el fix
fixCartSeatSync();

// Exportar funciones para uso manual
window.fixCartSeatSync = fixCartSeatSync;
window.testSeatSelection = testSeatSelection;
window.verifyCartAfterFix = verifyCartAfterFix;

console.log('📋 Funciones disponibles:');
console.log('- fixCartSeatSync() - Ejecutar fix completo');
console.log('- testSeatSelection() - Probar selección de asientos');
console.log('- verifyCartAfterFix() - Verificar carrito después del fix');
