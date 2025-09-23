// Script para probar la prioridad de estados de asientos
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de prioridad de estados...');

// 1. Verificar que el store está disponible
if (typeof window.seatLockStore === 'undefined') {
  console.error('❌ [TEST] seatLockStore NO está disponible');
  return;
}

console.log('✅ [TEST] seatLockStore está disponible');

// 2. Función para verificar la prioridad de estados
function testSeatStatePriority(seatId) {
  console.log(`\n🎯 [TEST] Verificando prioridad de estados para: ${seatId}`);
  
  const store = window.seatLockStore.getState();
  const currentSessionId = localStorage.getItem('anonSessionId') || 'unknown';
  
  // Verificar en lockedSeats
  const lock = store.lockedSeats?.find(lock => lock.seat_id === seatId);
  if (lock) {
    console.log(`  - En lockedSeats: ${lock.status} (${lock.session_id})`);
    
    // Determinar estado visual esperado
    let expectedState = 'seleccionado_por_otro';
    if (lock.status === 'pagado' || lock.status === 'vendido') {
      expectedState = 'vendido';
    } else if (lock.status === 'reservado') {
      expectedState = 'reservado';
    } else if (lock.status === 'seleccionado') {
      if (lock.session_id === currentSessionId) {
        expectedState = 'seleccionado';
      } else {
        expectedState = 'seleccionado_por_otro';
      }
    }
    
    console.log(`  - Estado esperado: ${expectedState}`);
  } else {
    console.log('  - NO está en lockedSeats');
  }
  
  // Verificar en seatStates
  const actualState = store.seatStates?.get(seatId);
  if (actualState) {
    console.log(`  - Estado actual en seatStates: ${actualState}`);
    
    // Verificar si coincide con el esperado
    if (lock && actualState === expectedState) {
      console.log('  ✅ [TEST] Estado correcto - seat_locks tiene prioridad');
    } else if (lock && actualState !== expectedState) {
      console.log('  ❌ [TEST] Estado incorrecto - debería ser:', expectedState);
    } else if (!lock && actualState === 'vendido') {
      console.log('  ✅ [TEST] Estado correcto - payment_transactions aplicado');
    } else {
      console.log('  ⚠️ [TEST] Estado inesperado');
    }
  } else {
    console.log('  - NO está en seatStates (disponible)');
  }
}

// 3. Función para simular el escenario de conflicto
async function simulateStateConflict(seatId, funcionId) {
  console.log(`\n🧪 [TEST] Simulando conflicto de estados para: ${seatId}`);
  
  try {
    // Verificar estado inicial
    console.log('📊 [TEST] Estado inicial:');
    testSeatStatePriority(seatId);
    
    // Simular selección de asiento
    console.log('\n🔄 [TEST] Simulando selección de asiento...');
    const store = window.seatLockStore.getState();
    const lockResult = await store.lockSeat(seatId, 'seleccionado', funcionId);
    
    if (lockResult) {
      console.log('✅ [TEST] Asiento bloqueado exitosamente');
      
      // Esperar un momento para que se procese
      setTimeout(() => {
        console.log('\n📊 [TEST] Estado después de selección:');
        testSeatStatePriority(seatId);
      }, 1000);
    } else {
      console.log('❌ [TEST] Error al bloquear asiento');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error en simulateStateConflict:', error);
  }
}

// 4. Función para verificar todos los asientos problemáticos
function testAllProblematicSeats() {
  console.log('\n🧪 [TEST] Verificando todos los asientos problemáticos...');
  
  const problematicSeats = [
    'silla_1757209438389_41',
    'silla_1755825682843_2'
  ];
  
  problematicSeats.forEach(seatId => {
    testSeatStatePriority(seatId);
  });
}

// 5. Función para verificar la lógica de prioridad
function verifyPriorityLogic() {
  console.log('\n🧠 [TEST] Verificando lógica de prioridad...');
  
  const store = window.seatLockStore.getState();
  
  if (store.seatStates && store.seatStates.size > 0) {
    console.log('📊 [TEST] Análisis de prioridad:');
    
    store.seatStates.forEach((state, seatId) => {
      const lock = store.lockedSeats?.find(lock => lock.seat_id === seatId);
      
      if (lock) {
        // Asiento está en seat_locks
        if (state === 'vendido' && lock.status !== 'vendido' && lock.status !== 'pagado') {
          console.log(`  ❌ [TEST] ${seatId}: Estado 'vendido' pero lock es '${lock.status}' - PRIORIDAD INCORRECTA`);
        } else {
          console.log(`  ✅ [TEST] ${seatId}: Estado '${state}' coincide con lock '${lock.status}' - PRIORIDAD CORRECTA`);
        }
      } else {
        // Asiento NO está en seat_locks
        if (state === 'vendido') {
          console.log(`  ✅ [TEST] ${seatId}: Estado 'vendido' sin lock - payment_transactions aplicado correctamente`);
        } else {
          console.log(`  ⚠️ [TEST] ${seatId}: Estado '${state}' sin lock - inesperado`);
        }
      }
    });
  } else {
    console.log('ℹ️ [TEST] No hay estados de asientos para verificar');
  }
}

// Ejecutar todas las pruebas
testAllProblematicSeats();
verifyPriorityLogic();

// Exponer funciones para uso manual
window.testSeatPriority = {
  testSeatStatePriority,
  simulateStateConflict,
  testAllProblematicSeats,
  verifyPriorityLogic
};

console.log('\n🔧 [TEST] Funciones de prueba expuestas en window.testSeatPriority');
console.log('🔧 [TEST] Usa window.testSeatPriority.testSeatStatePriority("silla_1757209438389_41") para probar un asiento específico');
