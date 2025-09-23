// Script para probar la sincronización en tiempo real
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Probando sincronización en tiempo real...');

// 1. Verificar el estado actual del seatLockStore
const seatLockStore = window.seatLockStore || null;
if (seatLockStore) {
  const state = seatLockStore.getState();
  console.log('📊 [TEST] Estado actual del seatLockStore:', {
    lockedSeats: state.lockedSeats?.length || 0,
    seatStates: state.seatStates?.size || 0,
    funcionId: state.funcionId
  });
  
  // Verificar si el asiento específico está en el store
  const seatId = 'silla_1755825682843_4';
  const seatState = state.seatStates?.get(seatId);
  console.log('🔍 [TEST] Estado del asiento en seatStates:', seatState);
  
  const lockedSeat = state.lockedSeats?.find(lock => lock.seat_id === seatId);
  console.log('🔍 [TEST] Estado del asiento en lockedSeats:', lockedSeat);
} else {
  console.log('❌ [TEST] seatLockStore no encontrado');
}

// 2. Verificar la suscripción en tiempo real
console.log('🔍 [TEST] Verificando suscripciones activas...');
const supabase = window.supabase || null;
if (supabase) {
  console.log('✅ [TEST] Supabase encontrado');
  // Verificar canales activos
  const channels = supabase.getChannels();
  console.log('📊 [TEST] Canales activos:', channels.length);
  channels.forEach((channel, index) => {
    console.log(`  Canal ${index + 1}:`, channel.topic);
  });
} else {
  console.log('❌ [TEST] Supabase no encontrado');
}

// 3. Simular una actualización manual
console.log('🧪 [TEST] Simulando actualización manual...');
if (seatLockStore) {
  const state = seatLockStore.getState();
  const newSeatStates = new Map(state.seatStates);
  newSeatStates.set('silla_1755825682843_4', 'vendido');
  
  seatLockStore.setState({ seatStates: newSeatStates });
  console.log('✅ [TEST] Estado actualizado manualmente');
}
