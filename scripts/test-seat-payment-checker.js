// Script para probar el servicio seatPaymentChecker
// Ejecutar en la consola del navegador

// Simular la verificación del asiento pagado
const testSeatPaymentChecker = async () => {
  console.log('🧪 [TEST] Probando seatPaymentChecker...');
  
  const seatId = 'silla_1755825682843_4';
  const funcionId = 43;
  const sessionId = '713a4d5b-bab9-4370-8c25-afb8dd198d6d'; // El usuario que compró
  
  try {
    // Importar el servicio (esto solo funciona si estás en la página)
    const { default: seatPaymentChecker } = await import('./src/services/seatPaymentChecker.js');
    
    console.log('🔍 [TEST] Verificando asiento pagado por usuario...');
    const result = await seatPaymentChecker.isSeatPaidByUser(seatId, funcionId, sessionId);
    
    console.log('📊 [TEST] Resultado:', result);
    
    if (result.isPaid) {
      console.log('✅ [TEST] Asiento detectado como pagado correctamente');
      console.log('📋 [TEST] Status:', result.status);
      console.log('📋 [TEST] Source:', result.source);
    } else {
      console.log('❌ [TEST] Asiento NO detectado como pagado');
    }
    
    // Probar también con otro usuario
    console.log('🔍 [TEST] Verificando asiento pagado por otro usuario...');
    const otherSessionId = 'cf142159-506f-4fe6-a45c-98ca2fd07f20'; // Otro usuario
    const resultOther = await seatPaymentChecker.isSeatPaidByUser(seatId, funcionId, otherSessionId);
    
    console.log('📊 [TEST] Resultado para otro usuario:', resultOther);
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
};

// Ejecutar la prueba
testSeatPaymentChecker();
