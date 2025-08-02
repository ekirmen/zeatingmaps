// Script para insertar datos de prueba en las tablas de mapas, zonas y asientos
import { createClient } from '@supabase/supabase-js';

// Variables de entorno (ajusta según tu configuración)
const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bXlxb2R3d3dkd2pkb2R6ZWJjcCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1NzI5NzIwLCJleHAiOjIwNTEzMDU3MjB9.2QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL o Anon Key no están definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTestData() {
  try {
    console.log('🚀 Insertando datos de prueba...');

    // 1. Insertar recinto de prueba
    const { data: recinto, error: recintoError } = await supabase
      .from('recintos')
      .insert({
        nombre: 'Teatro de Prueba',
        direccion: 'Calle de Prueba 123',
        ciudad: 'Ciudad de Prueba',
        pais: 'País de Prueba'
      })
      .select()
      .single();

    if (recintoError) {
      console.error('Error insertando recinto:', recintoError);
      return;
    }

    console.log('✅ Recinto insertado:', recinto.nombre);

    // 2. Insertar sala de prueba
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .insert({
        nombre: 'Sala Principal',
        recinto_id: recinto.id,
        capacidad: 100,
        descripcion: 'Sala principal del teatro'
      })
      .select()
      .single();

    if (salaError) {
      console.error('Error insertando sala:', salaError);
      return;
    }

    console.log('✅ Sala insertada:', sala.nombre);

    // 3. Insertar zonas
    const zonas = [
      { nombre: 'VIP', color: '#ff6b6b', aforo: 20, numerada: true },
      { nombre: 'General', color: '#4ecdc4', aforo: 60, numerada: true },
      { nombre: 'Económica', color: '#45b7d1', aforo: 20, numerada: false }
    ];

    const zonasInsertadas = [];
    for (const zona of zonas) {
      const { data: zonaInsertada, error: zonaError } = await supabase
        .from('zonas')
        .insert({
          ...zona,
          sala_id: sala.id
        })
        .select()
        .single();

      if (zonaError) {
        console.error('Error insertando zona:', zonaError);
        continue;
      }

      zonasInsertadas.push(zonaInsertada);
      console.log('✅ Zona insertada:', zonaInsertada.nombre);
    }

    // 4. Insertar mapa con mesas y sillas
    const mapaContenido = [
      {
        _id: 'mesa-1',
        type: 'mesa',
        nombre: 'Mesa 1',
        posicion: { x: 100, y: 100 },
        width: 80,
        height: 60,
        zona: zonasInsertadas[0].id, // VIP
        sillas: [
          { _id: 'silla-1-1', nombre: 'A1', posicion: { x: 70, y: 70 }, zona: zonasInsertadas[0].id, estado: 'disponible' },
          { _id: 'silla-1-2', nombre: 'A2', posicion: { x: 90, y: 70 }, zona: zonasInsertadas[0].id, estado: 'disponible' },
          { _id: 'silla-1-3', nombre: 'A3', posicion: { x: 110, y: 70 }, zona: zonasInsertadas[0].id, estado: 'disponible' },
          { _id: 'silla-1-4', nombre: 'A4', posicion: { x: 130, y: 70 }, zona: zonasInsertadas[0].id, estado: 'disponible' }
        ]
      },
      {
        _id: 'mesa-2',
        type: 'mesa',
        nombre: 'Mesa 2',
        posicion: { x: 250, y: 100 },
        width: 80,
        height: 60,
        zona: zonasInsertadas[1].id, // General
        sillas: [
          { _id: 'silla-2-1', nombre: 'B1', posicion: { x: 220, y: 70 }, zona: zonasInsertadas[1].id, estado: 'disponible' },
          { _id: 'silla-2-2', nombre: 'B2', posicion: { x: 240, y: 70 }, zona: zonasInsertadas[1].id, estado: 'disponible' },
          { _id: 'silla-2-3', nombre: 'B3', posicion: { x: 260, y: 70 }, zona: zonasInsertadas[1].id, estado: 'disponible' },
          { _id: 'silla-2-4', nombre: 'B4', posicion: { x: 280, y: 70 }, zona: zonasInsertadas[1].id, estado: 'disponible' }
        ]
      },
      {
        _id: 'mesa-3',
        type: 'mesa',
        nombre: 'Mesa 3',
        posicion: { x: 400, y: 100 },
        width: 80,
        height: 60,
        zona: zonasInsertadas[2].id, // Económica
        sillas: [
          { _id: 'silla-3-1', nombre: 'C1', posicion: { x: 370, y: 70 }, zona: zonasInsertadas[2].id, estado: 'disponible' },
          { _id: 'silla-3-2', nombre: 'C2', posicion: { x: 390, y: 70 }, zona: zonasInsertadas[2].id, estado: 'disponible' },
          { _id: 'silla-3-3', nombre: 'C3', posicion: { x: 410, y: 70 }, zona: zonasInsertadas[2].id, estado: 'disponible' },
          { _id: 'silla-3-4', nombre: 'C4', posicion: { x: 430, y: 70 }, zona: zonasInsertadas[2].id, estado: 'disponible' }
        ]
      }
    ];

    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .insert({
        sala_id: sala.id,
        contenido: mapaContenido,
        zonas: zonasInsertadas
      })
      .select()
      .single();

    if (mapaError) {
      console.error('Error insertando mapa:', mapaError);
      return;
    }

    console.log('✅ Mapa insertado para sala:', sala.nombre);

    // 5. Insertar evento de prueba
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .insert({
        nombre: 'Concierto de Prueba',
        descripcion: 'Un concierto de prueba para mostrar el sistema',
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        recinto_id: recinto.id
      })
      .select()
      .single();

    if (eventoError) {
      console.error('Error insertando evento:', eventoError);
      return;
    }

    console.log('✅ Evento insertado:', evento.nombre);

    // 6. Insertar función de prueba
    const { data: funcion, error: funcionError } = await supabase
      .from('funciones')
      .insert({
        nombre: 'Función Principal',
        evento_id: evento.id,
        sala_id: sala.id,
        fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        hora: '20:00:00',
        estado: 'activo'
      })
      .select()
      .single();

    if (funcionError) {
      console.error('Error insertando función:', funcionError);
      return;
    }

    console.log('✅ Función insertada:', funcion.nombre);

    // 7. Insertar asientos para la función
    const asientos = [];
    mapaContenido.forEach(mesa => {
      mesa.sillas.forEach(silla => {
        asientos.push({
          _id: silla._id,
          funcion_id: funcion.id,
          zona: silla.zona,
          status: 'disponible',
          bloqueado: false
        });
      });
    });

    const { error: asientosError } = await supabase
      .from('seats')
      .insert(asientos);

    if (asientosError) {
      console.error('Error insertando asientos:', asientosError);
      return;
    }

    console.log('✅ Asientos insertados:', asientos.length);

    // 8. Insertar plantilla de precios
    const { data: plantilla, error: plantillaError } = await supabase
      .from('plantillas')
      .insert({
        nombre: 'Plantilla de Prueba',
        detalles: {
          [zonasInsertadas[0].id]: { precio: 50.00, nombre: 'VIP' },
          [zonasInsertadas[1].id]: { precio: 30.00, nombre: 'General' },
          [zonasInsertadas[2].id]: { precio: 15.00, nombre: 'Económica' }
        }
      })
      .select()
      .single();

    if (plantillaError) {
      console.error('Error insertando plantilla:', plantillaError);
      return;
    }

    console.log('✅ Plantilla de precios insertada:', plantilla.nombre);

    console.log('\n🎉 ¡Datos de prueba insertados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Recinto: ${recinto.nombre}`);
    console.log(`   - Sala: ${sala.nombre}`);
    console.log(`   - Zonas: ${zonasInsertadas.length}`);
    console.log(`   - Mesas: ${mapaContenido.length}`);
    console.log(`   - Asientos: ${asientos.length}`);
    console.log(`   - Evento: ${evento.nombre}`);
    console.log(`   - Función: ${funcion.nombre}`);
    console.log(`   - Plantilla: ${plantilla.nombre}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
insertTestData(); 