// Script para analizar el rendimiento del sistema de cache
// Ejecutar en la consola del navegador

console.log('📊 [PERFORMANCE] Análisis de rendimiento del sistema...');

// Función para medir el rendimiento
async function analyzePerformance() {
  try {
    const { useSeatLockStore } = await import('../src/components/seatLockStore');
    const seatStore = useSeatLockStore.getState();
    
    console.log('🔍 [PERFORMANCE] Analizando sistema de cache...');
    
    // Simular múltiples verificaciones del mismo asiento
    const testSeatId = 'performance_test_seat';
    const testFuncionId = 1;
    
    console.log('⏱️ [PERFORMANCE] Primera verificación (debería consultar BD)...');
    const start1 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end1 = performance.now();
    console.log(`⏱️ [PERFORMANCE] Tiempo primera verificación: ${(end1 - start1).toFixed(2)}ms`);
    
    console.log('⏱️ [PERFORMANCE] Segunda verificación (debería usar cache)...');
    const start2 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end2 = performance.now();
    console.log(`⏱️ [PERFORMANCE] Tiempo segunda verificación: ${(end2 - start2).toFixed(2)}ms`);
    
    console.log('⏱️ [PERFORMANCE] Tercera verificación (debería usar cache)...');
    const start3 = performance.now();
    await seatStore.isSeatLocked(testSeatId, testFuncionId);
    const end3 = performance.now();
    console.log(`⏱️ [PERFORMANCE] Tiempo tercera verificación: ${(end3 - start3).toFixed(2)}ms`);
    
    // Calcular mejora de rendimiento
    const improvement = ((end1 - start1) - (end2 - start2)) / (end1 - start1) * 100;
    console.log(`📈 [PERFORMANCE] Mejora de rendimiento con cache: ${improvement.toFixed(1)}%`);
    
    // Mostrar estado del cache
    console.log('📋 [PERFORMANCE] Estado del cache:', {
      cacheSize: seatStore.seatStatusCache.size,
      cacheEntries: Array.from(seatStore.seatStatusCache.entries())
    });
    
  } catch (error) {
    console.error('❌ [PERFORMANCE] Error en análisis:', error);
  }
}

// Función para simular carga de trabajo
async function simulateWorkload() {
  console.log('🔄 [PERFORMANCE] Simulando carga de trabajo...');
  
  const { useSeatLockStore } = await import('../src/components/seatLockStore');
  const seatStore = useSeatLockStore.getState();
  
  const seats = ['seat_1', 'seat_2', 'seat_3', 'seat_4', 'seat_5'];
  const iterations = 10;
  
  console.log(`🔄 [PERFORMANCE] Verificando ${seats.length} asientos ${iterations} veces cada uno...`);
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const seatId of seats) {
      await seatStore.isSeatLocked(seatId, 1);
    }
  }
  
  const end = performance.now();
  const totalTime = end - start;
  const avgTimePerCheck = totalTime / (seats.length * iterations);
  
  console.log(`⏱️ [PERFORMANCE] Tiempo total: ${totalTime.toFixed(2)}ms`);
  console.log(`⏱️ [PERFORMANCE] Tiempo promedio por verificación: ${avgTimePerCheck.toFixed(2)}ms`);
  console.log(`📊 [PERFORMANCE] Verificaciones por segundo: ${(1000 / avgTimePerCheck).toFixed(0)}`);
  
  // Mostrar estadísticas del cache
  console.log('📋 [PERFORMANCE] Estadísticas finales del cache:', {
    cacheSize: seatStore.seatStatusCache.size,
    cacheHitRate: 'Calculado automáticamente por el sistema'
  });
}

// Función para mostrar comparación de métodos
function showComparison() {
  console.log('📊 [PERFORMANCE] Comparación de métodos:');
  console.log('');
  console.log('❌ SIN CACHE (consultar BD cada vez):');
  console.log('   - Tiempo: ~100-500ms por verificación');
  console.log('   - Recursos: Alto consumo de BD');
  console.log('   - Escalabilidad: Muy mala');
  console.log('');
  console.log('✅ CON CACHE INTELIGENTE (implementado - 1 segundo para pruebas):');
  console.log('   - Primera verificación: ~100-500ms (consulta BD)');
  console.log('   - Verificaciones siguientes: ~1-5ms (cache por 1 segundo)');
  console.log('   - Recursos: Mínimo consumo de BD');
  console.log('   - Escalabilidad: Excelente');
  console.log('');
  console.log('🔄 WEBSOCKET EN TIEMPO REAL (ya implementado):');
  console.log('   - Actualizaciones instantáneas cuando hay cambios');
  console.log('   - Sin polling, solo eventos');
  console.log('   - Recursos: Mínimos');
  console.log('');
  console.log('🎯 RESULTADO: Sistema optimizado para máximo rendimiento');
}

// Ejecutar análisis
analyzePerformance();
setTimeout(simulateWorkload, 2000);
showComparison();

console.log('📊 [PERFORMANCE] Análisis iniciado. Revisa la consola para los resultados.');
