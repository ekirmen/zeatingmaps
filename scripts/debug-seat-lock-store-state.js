// Script para debuggear el estado del seatLockStore
// Ejecutar en la consola del navegador

console.log('🔍 [DEBUG] Iniciando debug del seatLockStore...');

// 1. Verificar que el store está disponible
if (typeof window.seatLockStore === 'undefined') {
  console.error('❌ [DEBUG] seatLockStore NO está disponible');
  return;
}

console.log('✅ [DEBUG] seatLockStore está disponible');

// 2. Función para debuggear el estado completo
function debugSeatLockStore() {
  const store = window.seatLockStore.getState();
  
  console.log('📊 [DEBUG] Estado completo del seatLockStore:');
  console.log('  - lockedSeats:', store.lockedSeats?.length || 0);
  console.log('  - lockedTables:', store.lockedTables?.length || 0);
  console.log('  - seatStates size:', store.seatStates?.size || 0);
  console.log('  - channel:', store.channel ? 'Conectado' : 'Desconectado');
  
  // 3. Debuggear lockedSeats
  if (store.lockedSeats && store.lockedSeats.length > 0) {
    console.log('🔒 [DEBUG] Asientos bloqueados:');
    store.lockedSeats.forEach((lock, index) => {
      console.log(`  ${index + 1}. ${lock.seat_id}: ${lock.status} (${lock.session_id})`);
    });
  } else {
    console.log('ℹ️ [DEBUG] No hay asientos bloqueados');
  }
  
  // 4. Debuggear seatStates
  if (store.seatStates && store.seatStates.size > 0) {
    console.log('🎨 [DEBUG] Estados de asientos:');
    store.seatStates.forEach((state, seatId) => {
      console.log(`  - ${seatId}: ${state}`);
    });
  } else {
    console.log('ℹ️ [DEBUG] No hay estados de asientos');
  }
  
  // 5. Verificar asiento específico
  const testSeatId = 'silla_1757209438389_41';
  console.log(`\n🎯 [DEBUG] Verificando asiento específico: ${testSeatId}`);
  
  // Verificar en lockedSeats
  const lockInSeats = store.lockedSeats?.find(lock => lock.seat_id === testSeatId);
  if (lockInSeats) {
    console.log(`  - En lockedSeats: ${lockInSeats.status} (${lockInSeats.session_id})`);
  } else {
    console.log('  - NO está en lockedSeats');
  }
  
  // Verificar en seatStates
  const stateInSeats = store.seatStates?.get(testSeatId);
  if (stateInSeats) {
    console.log(`  - En seatStates: ${stateInSeats}`);
  } else {
    console.log('  - NO está en seatStates');
  }
}

// 6. Función para verificar la lógica de prioridad
function debugSeatStateLogic(seatId) {
  console.log(`\n🧠 [DEBUG] Analizando lógica de estado para: ${seatId}`);
  
  const store = window.seatLockStore.getState();
  const currentSessionId = localStorage.getItem('anonSessionId') || 'unknown';
  
  // Verificar en lockedSeats
  const lock = store.lockedSeats?.find(lock => lock.seat_id === seatId);
  if (lock) {
    console.log(`  - Lock encontrado: ${lock.status} (${lock.session_id})`);
    console.log(`  - Session actual: ${currentSessionId}`);
    console.log(`  - Es del usuario actual: ${lock.session_id === currentSessionId}`);
    
    // Determinar estado visual
    let visualState = 'seleccionado_por_otro';
    if (lock.status === 'pagado' || lock.status === 'vendido') {
      visualState = 'vendido';
    } else if (lock.status === 'reservado') {
      visualState = 'reservado';
    } else if (lock.status === 'seleccionado') {
      if (lock.session_id === currentSessionId) {
        visualState = 'seleccionado';
      } else {
        visualState = 'seleccionado_por_otro';
      }
    }
    
    console.log(`  - Estado visual calculado: ${visualState}`);
  } else {
    console.log('  - NO hay lock en lockedSeats');
  }
  
  // Verificar en seatStates
  const seatState = store.seatStates?.get(seatId);
  if (seatState) {
    console.log(`  - Estado en seatStates: ${seatState}`);
  } else {
    console.log('  - NO hay estado en seatStates');
  }
}

// 7. Función para verificar datos de payment_transactions
async function debugPaymentTransactions() {
  console.log('\n💳 [DEBUG] Verificando payment_transactions...');
  
  try {
    const { data, error } = await window.supabase
      .from('payment_transactions')
      .select('seats, user_id, usuario_id, status')
      .eq('funcion_id', 43)
      .eq('status', 'completed');
    
    if (error) {
      console.error('❌ [DEBUG] Error cargando payment_transactions:', error);
      return;
    }
    
    console.log(`📊 [DEBUG] Payment transactions encontradas: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      data.forEach((payment, index) => {
        console.log(`  ${index + 1}. Payment ID: ${payment.id || 'N/A'}, Status: ${payment.status}`);
        try {
          const seats = typeof payment.seats === 'string' ? JSON.parse(payment.seats) : payment.seats;
          if (Array.isArray(seats)) {
            seats.forEach(seat => {
              const seatId = seat.sillaId || seat.id || seat._id;
              if (seatId === 'silla_1757209438389_41') {
                console.log(`    🎯 Asiento encontrado: ${seatId}`);
              }
            });
          }
        } catch (e) {
          console.error('    - Error parseando seats:', e);
        }
      });
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error inesperado:', error);
  }
}

// Ejecutar todas las verificaciones
debugSeatLockStore();
debugSeatStateLogic('silla_1757209438389_41');
debugPaymentTransactions();

// Exponer funciones para uso manual
window.debugSeatLock = {
  debugSeatLockStore,
  debugSeatStateLogic,
  debugPaymentTransactions
};

console.log('\n🔧 [DEBUG] Funciones de debug expuestas en window.debugSeatLock');
console.log('🔧 [DEBUG] Usa window.debugSeatLock.debugSeatLockStore() para debuggear el estado');
