// Script de prueba para verificar el funcionamiento de seat locks
console.log('=== PRUEBA DE SEAT LOCKS ===');

// Simular el store de seat locks
const mockStore = {
  lockedSeats: [],
  lockedTables: [],
  
  setLockedSeats: function(seats) {
    console.log('setLockedSeats llamado con:', seats);
    this.lockedSeats = Array.isArray(seats) ? seats : [];
  },
  
  setLockedTables: function(tables) {
    console.log('setLockedTables llamado con:', tables);
    this.lockedTables = Array.isArray(tables) ? tables : [];
  },
  
  isSeatLocked: function(seatId) {
    return this.lockedSeats.some(s => s.seat_id === seatId);
  },
  
  isSeatLockedByMe: function(seatId) {
    const sessionId = localStorage.getItem('anonSessionId');
    return this.lockedSeats.some(s => s.seat_id === seatId && s.session_id === sessionId);
  }
};

// Función para validar session_id
function normalizeSessionId(sessionId) {
  if (!sessionId) return null;
  return String(sessionId);
}

// Función para validar seat_id
function isValidSeatId(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// Simular bloqueo de asiento
function lockSeat(seatId, funcionId = 10) {
  if (!isValidSeatId(seatId)) {
    console.error('seat_id inválido:', seatId);
    return false;
  }
  
  const sessionId = normalizeSessionId(localStorage.getItem('anonSessionId') || 'test-session');
  const lockedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  const lock = {
    seat_id: seatId,
    funcion_id: funcionId,
    session_id: sessionId,
    locked_at: lockedAt,
    expires_at: expiresAt,
    status: 'seleccionado',
    lock_type: 'seat'
  };
  
  mockStore.setLockedSeats([...mockStore.lockedSeats, lock]);
  console.log('Asiento bloqueado:', seatId);
  return true;
}

// Simular desbloqueo de asiento
function unlockSeat(seatId) {
  const sessionId = normalizeSessionId(localStorage.getItem('anonSessionId') || 'test-session');
  
  const updatedSeats = mockStore.lockedSeats.filter(s => 
    !(s.seat_id === seatId && s.session_id === sessionId)
  );
  
  mockStore.setLockedSeats(updatedSeats);
  console.log('Asiento desbloqueado:', seatId);
  return true;
}

// Pruebas
console.log('\n--- PRUEBA 1: Bloquear asiento ---');
lockSeat('silla_1');
console.log('Estado después de bloquear:', mockStore.lockedSeats);
console.log('¿Está bloqueado silla_1?', mockStore.isSeatLocked('silla_1'));

console.log('\n--- PRUEBA 2: Desbloquear asiento ---');
unlockSeat('silla_1');
console.log('Estado después de desbloquear:', mockStore.lockedSeats);
console.log('¿Está bloqueado silla_1?', mockStore.isSeatLocked('silla_1'));

console.log('\n--- PRUEBA 3: Múltiples asientos ---');
lockSeat('silla_1');
lockSeat('silla_2');
lockSeat('silla_3');
console.log('Estado con múltiples asientos:', mockStore.lockedSeats);

unlockSeat('silla_2');
console.log('Estado después de desbloquear silla_2:', mockStore.lockedSeats);

console.log('\n=== PRUEBA COMPLETADA ==='); 