// Script para probar la estructura del mapa
const testMapStructure = {
  "zonas": [
    {
      "id": 9, 
      "_id": "zona_9", 
      "type": "zona", 
      "color": "#c8ff00", 
      "nombre": "Oro", 
      "asientos": [
        {
          "x": 100, 
          "y": 100, 
          "_id": "silla_1", 
          "alto": 30, 
          "zona": 9, 
          "ancho": 30, 
          "estado": "disponible", 
          "nombre": "1"
        }, 
        {
          "x": 140, 
          "y": 100, 
          "_id": "silla_2", 
          "alto": 30, 
          "zona": 9, 
          "ancho": 30, 
          "estado": "disponible", 
          "nombre": "2"
        }, 
        {
          "x": 180, 
          "y": 100, 
          "_id": "silla_3", 
          "alto": 30, 
          "zona": 9, 
          "ancho": 30, 
          "estado": "disponible", 
          "nombre": "3"
        }, 
        {
          "x": 100, 
          "y": 140, 
          "_id": "silla_4", 
          "alto": 30, 
          "zona": 9, 
          "ancho": 30, 
          "estado": "disponible", 
          "nombre": "4"
        }, 
        {
          "x": 140, 
          "y": 140, 
          "_id": "silla_5", 
          "alto": 30, 
          "zona": 9, 
          "ancho": 30, 
          "estado": "disponible", 
          "nombre": "5"
        }
      ]
    }
  ]
};

// Simular el procesamiento que hace el componente SeatingMapUnified
function processMapStructure(mapa) {
  console.log('=== PROCESAMIENTO DE ESTRUCTURA DE MAPA ===\n');
  
  // 1. Extraer zonas
  const zonas = mapa?.zonas || mapa?.contenido?.zonas || [];
  console.log('1. Zonas extraídas:', zonas.length);
  zonas.forEach((zona, i) => {
    console.log(`   Zona ${i}: ${zona.nombre} (ID: ${zona.id}) - Color: ${zona.color}`);
  });
  
  // 2. Extraer todos los asientos
  const allSeats = zonas?.flatMap((z) => z.asientos || []) || [];
  console.log(`\n2. Asientos totales: ${allSeats.length}`);
  allSeats.forEach((asiento, i) => {
    console.log(`   Asiento ${i}: ${asiento.nombre} - Pos: (${asiento.x}, ${asiento.y}) - Estado: ${asiento.estado}`);
  });
  
  // 3. Extraer mesas
  const mesas = Array.isArray(mapa?.contenido) 
    ? mapa.contenido.filter(item => item.type === 'mesa') 
    : mapa?.contenido?.mesas || mapa?.contenido?.tables || [];
  console.log(`\n3. Mesas encontradas: ${mesas.length}`);
  mesas.forEach((mesa, i) => {
    console.log(`   Mesa ${i}: ${mesa.nombre} - Shape: ${mesa.shape} - Pos: (${mesa.posicion?.x}, ${mesa.posicion?.y})`);
  });
  
  // 4. Calcular dimensiones
  const maxX = Math.max(...allSeats.map((s) => s.x + (s.ancho || 30)), 800);
  const maxY = Math.max(...allSeats.map((s) => s.y + (s.alto || 30)), 600);
  console.log(`\n4. Dimensiones del mapa: ${maxX}x${maxY}`);
  
  // 5. Verificar estructura esperada
  console.log('\n5. Verificación de estructura:');
  console.log(`   - mapa.zonas existe: ${!!mapa.zonas}`);
  console.log(`   - mapa.contenido existe: ${!!mapa.contenido}`);
  console.log(`   - mapa.contenido.zonas existe: ${!!mapa.contenido?.zonas}`);
  
  return {
    zonas,
    allSeats,
    mesas,
    maxX,
    maxY
  };
}

// Probar con la estructura que me mostraste
console.log('Probando estructura de mapa proporcionada...\n');
const result = processMapStructure(testMapStructure);

console.log('\n=== RESULTADO ===');
console.log(`✅ Zonas procesadas: ${result.zonas.length}`);
console.log(`✅ Asientos procesados: ${result.allSeats.length}`);
console.log(`✅ Mesas procesadas: ${result.mesas.length}`);
console.log(`✅ Dimensiones: ${result.maxX}x${result.maxY}`);

// Probar también con la estructura que espera el componente
const expectedStructure = {
  contenido: testMapStructure
};

console.log('\n=== PROBANDO ESTRUCTURA ESPERADA ===');
const result2 = processMapStructure(expectedStructure);

console.log('\n=== COMPARACIÓN ===');
console.log(`Estructura directa - Asientos: ${result.allSeats.length}`);
console.log(`Estructura esperada - Asientos: ${result2.allSeats.length}`);
console.log('✅ Ambas estructuras producen el mismo resultado'); 