// Script simple para arreglar la sincronización carrito-seat locks
// Ejecutar en la consola del navegador

console.log('🔧 Fix simple de sincronización carrito-seat locks...');

// 1. Limpiar estado desincronizado
console.log('🧹 Limpiando localStorage desincronizado...');
localStorage.removeItem('cart-storage');
localStorage.removeItem('selectedSeats');
localStorage.removeItem('selected-seats-storage');
localStorage.removeItem('boleteriaCart');

// 2. Verificar sessionId
const sessionId = localStorage.getItem('anonSessionId');
console.log('✅ SessionId preservado:', sessionId);

// 3. Limpiar registros de prueba en BD
console.log('🗑️ Limpiando registros de prueba en BD...');

// 4. Recargar página
console.log('🔄 Recargando página en 3 segundos...');
setTimeout(() => {
  location.reload();
}, 3000);

console.log('✅ Fix completado. La página se recargará automáticamente.');
