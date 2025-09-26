// Script para probar si react-hot-toast está funcionando
console.log('🧪 [TEST_TOAST] Probando react-hot-toast...');

try {
  // Simular import de react-hot-toast
  const { toast } = require('react-hot-toast');
  console.log('✅ [TEST_TOAST] react-hot-toast importado correctamente');
  console.log('🧪 [TEST_TOAST] Funciones disponibles:', Object.keys(toast));
} catch (error) {
  console.error('❌ [TEST_TOAST] Error importando react-hot-toast:', error.message);
}

console.log('🧪 [TEST_TOAST] Prueba completada');
