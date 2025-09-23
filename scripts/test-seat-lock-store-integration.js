// Script para probar la integración del seatLockStore con payment_transactions
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Iniciando prueba de integración del seatLockStore...');

// 1. Verificar que el store está disponible
if (typeof window.seatLockStore !== 'undefined') {
  console.log('✅ [TEST] seatLockStore está disponible globalmente');
} else {
  console.error('❌ [TEST] seatLockStore NO está disponible globalmente');
}

// 2. Verificar que supabase está disponible
if (typeof window.supabase !== 'undefined') {
  console.log('✅ [TEST] supabase está disponible globalmente');
} else {
  console.error('❌ [TEST] supabase NO está disponible globalmente');
}

// 3. Obtener el estado actual del store
const store = window.seatLockStore.getState();
console.log('📊 [TEST] Estado actual del store:', {
  lockedSeats: store.lockedSeats?.length || 0,
  lockedTables: store.lockedTables?.length || 0,
  seatStates: store.seatStates?.size || 0,
  channel: store.channel ? 'Conectado' : 'Desconectado'
});

// 4. Verificar si hay estados de asientos
if (store.seatStates && store.seatStates.size > 0) {
  console.log('🎨 [TEST] Estados de asientos encontrados:');
  store.seatStates.forEach((state, seatId) => {
    console.log(`  - ${seatId}: ${state}`);
  });
} else {
  console.log('ℹ️ [TEST] No hay estados de asientos en el store');
}

// 5. Verificar si hay asientos bloqueados
if (store.lockedSeats && store.lockedSeats.length > 0) {
  console.log('🔒 [TEST] Asientos bloqueados encontrados:');
  store.lockedSeats.forEach(lock => {
    console.log(`  - ${lock.seat_id}: ${lock.status} (${lock.session_id})`);
  });
} else {
  console.log('ℹ️ [TEST] No hay asientos bloqueados en el store');
}

// 6. Función para probar la carga de datos de payment_transactions
async function testPaymentTransactionsLoad() {
  console.log('🧪 [TEST] Probando carga de payment_transactions...');
  
  try {
    const { data, error } = await window.supabase
      .from('payment_transactions')
      .select('seats, user_id, usuario_id, status')
      .eq('funcion_id', 43)
      .eq('status', 'completed');
    
    if (error) {
      console.error('❌ [TEST] Error cargando payment_transactions:', error);
      return;
    }
    
    console.log('📊 [TEST] Payment transactions cargadas:', data?.length || 0);
    
    if (data && data.length > 0) {
      data.forEach((payment, index) => {
        console.log(`  ${index + 1}. Payment ID: ${payment.id || 'N/A'}, Status: ${payment.status}`);
        try {
          const seats = typeof payment.seats === 'string' ? JSON.parse(payment.seats) : payment.seats;
          if (Array.isArray(seats)) {
            seats.forEach(seat => {
              const seatId = seat.sillaId || seat.id || seat._id;
              console.log(`    - Asiento: ${seatId}`);
            });
          }
        } catch (e) {
          console.error('    - Error parseando seats:', e);
        }
      });
    }
  } catch (error) {
    console.error('❌ [TEST] Error inesperado:', error);
  }
}

// 7. Función para probar la suscripción a cambios
function testSubscription() {
  console.log('🧪 [TEST] Probando suscripción a cambios...');
  
  const store = window.seatLockStore.getState();
  if (store.channel) {
    console.log('✅ [TEST] Canal de suscripción activo:', store.channel.topic);
  } else {
    console.log('❌ [TEST] No hay canal de suscripción activo');
  }
}

// Ejecutar las pruebas
testPaymentTransactionsLoad();
testSubscription();

console.log('🧪 [TEST] Pruebas completadas. Revisa los logs arriba para ver los resultados.');
