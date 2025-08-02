import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  try {
    console.log('🚀 Insertando datos de prueba...');

    // 1. Insertar un evento de prueba
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .insert({
        nombre: 'Concierto de Prueba',
        descripcion: 'Un concierto para probar el sistema',
        fecha_inicio: '2024-12-01',
        fecha_fin: '2024-12-01',
        estado: 'activo'
      })
      .select()
      .single();

    if (eventoError) throw eventoError;
    console.log('✅ Evento creado:', evento.id);

    // 2. Insertar una sala de prueba
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .insert({
        nombre: 'Sala de Prueba',
        capacidad: 100,
        recinto_id: 1 // Asumiendo que existe un recinto con ID 1
      })
      .select()
      .single();

    if (salaError) throw salaError;
    console.log('✅ Sala creada:', sala.id);

    // 3. Insertar una función de prueba
    const { data: funcion, error: funcionError } = await supabase
      .from('funciones')
      .insert({
        evento_id: evento.id,
        sala_id: sala.id,
        fecha_celebracion: '2024-12-01T20:00:00',
        inicio_venta: '2024-11-01T00:00:00',
        fin_venta: '2024-12-01T19:00:00',
        estado: 'activo'
      })
      .select()
      .single();

    if (funcionError) throw funcionError;
    console.log('✅ Función creada:', funcion.id);

    // 4. Insertar un mapa de prueba
    const mapaData = {
      sala_id: sala.id,
      nombre: 'Mapa de Prueba',
      contenido: JSON.stringify({
        zonas: [
          {
            id: 1,
            nombre: 'Zona VIP',
            asientos: [
              {
                _id: 'asiento-1-1',
                nombre: 'A1',
                x: 100,
                y: 100,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-1-2',
                nombre: 'A2',
                x: 140,
                y: 100,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-1-3',
                nombre: 'A3',
                x: 180,
                y: 100,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-1-4',
                nombre: 'A4',
                x: 220,
                y: 100,
                ancho: 30,
                alto: 30
              }
            ]
          },
          {
            id: 2,
            nombre: 'Zona Regular',
            asientos: [
              {
                _id: 'asiento-2-1',
                nombre: 'B1',
                x: 100,
                y: 150,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-2-2',
                nombre: 'B2',
                x: 140,
                y: 150,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-2-3',
                nombre: 'B3',
                x: 180,
                y: 150,
                ancho: 30,
                alto: 30
              },
              {
                _id: 'asiento-2-4',
                nombre: 'B4',
                x: 220,
                y: 150,
                ancho: 30,
                alto: 30
              }
            ]
          }
        ]
      })
    };

    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .insert(mapaData)
      .select()
      .single();

    if (mapaError) throw mapaError;
    console.log('✅ Mapa creado:', mapa.id);

    // 5. Insertar zonas de prueba
    const zonasData = [
      {
        id: 1,
        nombre: 'Zona VIP',
        sala_id: sala.id,
        precio_min: 50,
        precio_max: 70
      },
      {
        id: 2,
        nombre: 'Zona Regular',
        sala_id: sala.id,
        precio_min: 20,
        precio_max: 40
      }
    ];

    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .insert(zonasData)
      .select();

    if (zonasError) throw zonasError;
    console.log('✅ Zonas creadas:', zonas.length);

    console.log('🎉 Datos de prueba insertados correctamente');
    console.log('📋 Resumen:');
    console.log(`   - Evento ID: ${evento.id}`);
    console.log(`   - Sala ID: ${sala.id}`);
    console.log(`   - Función ID: ${funcion.id}`);
    console.log(`   - Mapa ID: ${mapa.id}`);
    console.log(`   - Zonas: ${zonas.length}`);

  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
  }
}

insertTestData(); 