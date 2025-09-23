// Script para debuggear el sessionId
// Ejecutar en la consola del navegador

console.log('🔍 [DEBUG] Verificando sessionId...');

// 1. Verificar el sessionId actual
const currentSessionId = localStorage.getItem('anonSessionId');
console.log('📋 [DEBUG] SessionId actual:', currentSessionId);

// 2. Verificar si coincide con el user_id de la transacción
const transactionUserId = '713a4d5b-bab9-4370-8c25-afb8dd198d6d';
console.log('📋 [DEBUG] User ID de la transacción:', transactionUserId);
console.log('📋 [DEBUG] ¿Coinciden?', currentSessionId === transactionUserId);

// 3. Verificar todos los sessionIds en localStorage
console.log('📋 [DEBUG] Todos los valores en localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value}`);
}

// 4. Verificar si hay algún problema con el formato
if (currentSessionId) {
  console.log('📋 [DEBUG] Tipo de sessionId:', typeof currentSessionId);
  console.log('📋 [DEBUG] Longitud:', currentSessionId.length);
  console.log('📋 [DEBUG] ¿Es UUID válido?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentSessionId));
}
