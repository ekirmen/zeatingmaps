// Script de prueba para verificar la conversión de datos del mapa
const testMapData = {
  id: 7,
  sala_id: 7,
  contenido: '{"zonas": [{"id": 9, "nombre": "Zona 9", "asientos": [{"x": 449, "y": 175, "_id": "c5506691-8bd2-45be-bb88-050318d8a9df", "alto": 20, "ancho": 20, "nombre": "1"}, {"x": 369, "y": 255, "_id": "9700a608-6cc6-4e7d-a61a-cb0a3f168aef", "alto": 20, "ancho": 20, "nombre": "2"}, {"x": 289, "y": 175, "_id": "06d73518-5485-4111-ae03-597c59779d51", "alto": 20, "ancho": 20, "nombre": "3"}, {"x": 369, "y": 95, "_id": "a3403363-4b2a-42bd-aaf9-1651f9c88f0c", "alto": 20, "ancho": 20, "nombre": "k"}]}]}'
};

console.log('🔍 Datos originales:', {
  id: testMapData.id,
  sala_id: testMapData.sala_id,
  contenido: typeof testMapData.contenido,
  contenidoValue: testMapData.contenido
});

// Simular la lógica de conversión
let contenidoData = testMapData.contenido;
if (typeof testMapData.contenido === 'string') {
  try {
    contenidoData = JSON.parse(testMapData.contenido);
    console.log('🔧 Parseando JSON del campo contenido:', contenidoData);
  } catch (err) {
    console.error('❌ Error parseando JSON del contenido:', err);
    contenidoData = testMapData.contenido;
  }
}

if (contenidoData && contenidoData.zonas) {
  console.log('🔄 Convirtiendo formato de zonas a contenido');
  const contenido = contenidoData.zonas.map((zona, zonaIndex) => ({
    _id: `zona-${zona.id || zonaIndex}`,
    type: 'zona',
    nombre: zona.nombre || `Zona ${zonaIndex + 1}`,
    posicion: { x: 0, y: 0 },
    width: 800,
    height: 600,
    zona: zona.id,
    sillas: zona.asientos.map((asiento, asientoIndex) => ({
      _id: asiento._id || `asiento-${zonaIndex}-${asientoIndex}`,
      nombre: asiento.nombre || `${asientoIndex + 1}`,
      posicion: { x: asiento.x || 0, y: asiento.y || 0 },
      width: asiento.ancho || 20,
      height: asiento.alto || 20,
      zona: zona.id,
      estado: 'disponible',
      color: '#60a5fa'
    }))
  }));
  
  const mapped = {
    ...testMapData,
    contenido
  };
  
  console.log('🎯 Mapa convertido:', {
    contenido: contenido.length,
    zonas: contenido.map(z => ({
      id: z._id,
      nombre: z.nombre,
      asientos: z.sillas.length,
      primerAsiento: z.sillas[0] ? {
        id: z.sillas[0]._id,
        nombre: z.sillas[0].nombre,
        posicion: z.sillas[0].posicion
      } : null
    }))
  });
  
  console.log('✅ Conversión exitosa!');
} else {
  console.log('❌ No se encontraron zonas en los datos');
} 