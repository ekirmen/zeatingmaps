// Script para probar el cache de 1 segundo
// Ejecutar en la consola del navegador

console.log('🧪 [TEST] Probando cache de 1 segundo...');

// Función para probar el cache
async function test1SecondCache() {
  try {
    const { useSeatLockStore } = await import('../src/components/seatLockStore');
    const seatStore = useSeatLockStore.getState();
    
    const testSeatId = 'cache_test_seat';
    const testFuncionId = 1;
    
    console.log('🎯 [TEST] Probando cache de 1 segundo...');
    
    // Primera verificación (debería consultar BD)
    console.log('⏱️ [TEST] Primera verificación (consulta BD)...');
    const start1 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end1 = performance.now();
    console.log(`⏱️ [TEST] Tiempo: ${(end1 - start1).toFixed(2)}ms`);
    
    // Segunda verificación inmediata (debería usar cache)
    console.log('⏱️ [TEST] Segunda verificación inmediata (usa cache)...');
    const start2 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end2 = performance.now();
    console.log(`⏱️ [TEST] Tiempo: ${(end2 - start2).toFixed(2)}ms`);
    
    // Tercera verificación inmediata (debería usar cache)
    console.log('⏱️ [TEST] Tercera verificación inmediata (usa cache)...');
    const start3 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end3 = performance.now();
    console.log(`⏱️ [TEST] Tiempo: ${(end3 - start3).toFixed(2)}ms`);
    
    // Esperar 1.5 segundos para que expire el cache
    console.log('⏳ [TEST] Esperando 1.5 segundos para que expire el cache...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Cuarta verificación después de 1.5 segundos (debería consultar BD nuevamente)
    console.log('⏱️ [TEST] Cuarta verificación después de 1.5s (consulta BD)...');
    const start4 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end4 = performance.now();
    console.log(`⏱️ [TEST] Tiempo: ${(end4 - start4).toFixed(2)}ms`);
    
    // Quinta verificación inmediata (debería usar cache nuevamente)
    console.log('⏱️ [TEST] Quinta verificación inmediata (usa cache)...');
    const start5 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end5 = performance.now();
    console.log(`⏱️ [TEST] Tiempo: ${(end5 - start5).toFixed(2)}ms`);
    
    // Mostrar resultados
    console.log('📊 [TEST] Resultados:');
    console.log(`   Primera verificación (BD): ${(end1 - start1).toFixed(2)}ms`);
    console.log(`   Segunda verificación (cache): ${(end2 - start2).toFixed(2)}ms`);
    console.log(`   Tercera verificación (cache): ${(end3 - start3).toFixed(2)}ms`);
    console.log(`   Cuarta verificación (BD): ${(end4 - start4).toFixed(2)}ms`);
    console.log(`   Quinta verificación (cache): ${(end5 - start5).toFixed(2)}ms`);
    
    // Verificar que el cache funciona
    const cacheWorking = (end2 - start2) < (end1 - start1) && (end5 - start5) < (end4 - start4);
    
    if (cacheWorking) {
      console.log('✅ [TEST] ¡Cache funcionando correctamente!');
    } else {
      console.log('❌ [TEST] Cache no está funcionando como esperado');
    }
    
    // Mostrar estado del cache
    console.log('📋 [TEST] Estado del cache:', {
      cacheSize: seatStore.seatStatusCache.size,
      cacheEntries: Array.from(seatStore.seatStatusCache.entries())
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
}

// Función para probar múltiples asientos
async function testMultipleSeats() {
  console.log('🔄 [TEST] Probando múltiples asientos...');
  
  const { useSeatLockStore } = await import('../src/components/seatLockStore');
  const seatStore = useSeatLockStore.getState();
  
  const seats = ['seat_1', 'seat_2', 'seat_3'];
  
  // Primera ronda - consultas BD
  console.log('⏱️ [TEST] Primera ronda (consultas BD)...');
  const start1 = performance.now();
  for (const seatId of seats) {
    await seatStore.isSeatLocked(seatId, 1);
  }
  const end1 = performance.now();
  console.log(`⏱️ [TEST] Tiempo total: ${(end1 - start1).toFixed(2)}ms`);
  
  // Segunda ronda - usa cache
  console.log('⏱️ [TEST] Segunda ronda (usa cache)...');
  const start2 = performance.now();
  for (const seatId of seats) {
    await seatStore.isSeatLocked(seatId, 1);
  }
  const end2 = performance.now();
  console.log(`⏱️ [TEST] Tiempo total: ${(end2 - start2).toFixed(2)}ms`);
  
  const improvement = ((end1 - start1) - (end2 - start2)) / (end1 - start1) * 100;
  console.log(`📈 [TEST] Mejora de rendimiento: ${improvement.toFixed(1)}%`);
  
  console.log('📋 [TEST] Cache final:', {
    cacheSize: seatStore.seatStatusCache.size
  });
}

// Ejecutar pruebas
test1SecondCache();
setTimeout(testMultipleSeats, 3000);

console.log('🧪 [TEST] Pruebas iniciadas. Revisa la consola para los resultados.');
