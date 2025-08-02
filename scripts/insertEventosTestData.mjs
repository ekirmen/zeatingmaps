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

async function insertEventosTestData() {
  try {
    console.log('🚀 Insertando datos de prueba para eventos...');

    // 1. Insertar un recinto de prueba
    const { data: recinto, error: recintoError } = await supabase
      .from('recintos')
      .insert({
        nombre: 'Teatro Principal',
        direccion: 'Calle Principal 123',
        ciudad: 'Ciudad de Prueba',
        pais: 'País de Prueba',
        capacidad: 500
      })
      .select()
      .single();

    if (recintoError) throw recintoError;
    console.log('✅ Recinto creado:', recinto.id);

    // 2. Insertar un evento de prueba con slug 'gg'
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .insert({
        nombre: 'Gran Concierto de Prueba',
        descripcion: 'Un espectacular concierto para probar el sistema de venta de entradas',
        slug: 'gg',
        fecha_inicio: '2024-12-01',
        fecha_fin: '2024-12-01',
        estado: 'activo',
        recinto_id: recinto.id,
        imagenes: JSON.stringify({
          banner: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop',
          portada: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          obraImagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        })
      })
      .select()
      .single();

    if (eventoError) throw eventoError;
    console.log('✅ Evento creado:', evento.id);

    // 3. Insertar una sala de prueba
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .insert({
        nombre: 'Sala Principal',
        capacidad: 200,
        recinto_id: recinto.id,
        descripcion: 'Sala principal del teatro'
      })
      .select()
      .single();

    if (salaError) throw salaError;
    console.log('✅ Sala creada:', sala.id);

    // 4. Insertar zonas de prueba
    const zonasData = [
      {
        id: 1,
        nombre: 'Zona VIP',
        sala_id: sala.id,
        precio_min: 80,
        precio_max: 120,
        color: '#ff6b6b'
      },
      {
        id: 2,
        nombre: 'Zona General',
        sala_id: sala.id,
        precio_min: 40,
        precio_max: 60,
        color: '#4ecdc4'
      },
      {
        id: 3,
        nombre: 'Zona Económica',
        sala_id: sala.id,
        precio_min: 20,
        precio_max: 30,
        color: '#45b7d1'
      }
    ];

    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .insert(zonasData)
      .select();

    if (zonasError) throw zonasError;
    console.log('✅ Zonas creadas:', zonas.length);

    // 5. Insertar plantilla de precios
    const { data: plantilla, error: plantillaError } = await supabase
      .from('plantillas')
      .insert({
        nombre: 'Plantilla de Prueba',
        detalles: JSON.stringify({
          detalles: [
            { zonaId: 1, precio: 100, nombre: 'VIP' },
            { zonaId: 2, precio: 50, nombre: 'General' },
            { zonaId: 3, precio: 25, nombre: 'Económica' }
          ]
        })
      })
      .select()
      .single();

    if (plantillaError) throw plantillaError;
    console.log('✅ Plantilla creada:', plantilla.id);

    // 6. Insertar función de prueba
    const { data: funcion, error: funcionError } = await supabase
      .from('funciones')
      .insert({
        evento_id: evento.id,
        sala_id: sala.id,
        plantilla_id: plantilla.id,
        fecha_celebracion: '2024-12-01T20:00:00',
        hora: '20:00:00',
        inicio_venta: '2024-11-01T00:00:00',
        fin_venta: '2024-12-01T19:00:00',
        estado: 'activo',
        nombre: 'Función Principal'
      })
      .select()
      .single();

    if (funcionError) throw funcionError;
    console.log('✅ Función creada:', funcion.id);

    // 7. Insertar mapa de prueba
    const mapaData = {
      sala_id: sala.id,
      nombre: 'Mapa de Prueba',
      contenido: JSON.stringify({
        zonas: [
          {
            id: 1,
            nombre: 'Zona VIP',
            asientos: [
              { _id: 'vip-1', nombre: 'A1', x: 100, y: 100, ancho: 30, alto: 30 },
              { _id: 'vip-2', nombre: 'A2', x: 140, y: 100, ancho: 30, alto: 30 },
              { _id: 'vip-3', nombre: 'A3', x: 180, y: 100, ancho: 30, alto: 30 },
              { _id: 'vip-4', nombre: 'A4', x: 220, y: 100, ancho: 30, alto: 30 },
              { _id: 'vip-5', nombre: 'A5', x: 260, y: 100, ancho: 30, alto: 30 },
              { _id: 'vip-6', nombre: 'A6', x: 300, y: 100, ancho: 30, alto: 30 }
            ]
          },
          {
            id: 2,
            nombre: 'Zona General',
            asientos: [
              { _id: 'gen-1', nombre: 'B1', x: 100, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-2', nombre: 'B2', x: 140, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-3', nombre: 'B3', x: 180, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-4', nombre: 'B4', x: 220, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-5', nombre: 'B5', x: 260, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-6', nombre: 'B6', x: 300, y: 150, ancho: 30, alto: 30 },
              { _id: 'gen-7', nombre: 'B7', x: 100, y: 190, ancho: 30, alto: 30 },
              { _id: 'gen-8', nombre: 'B8', x: 140, y: 190, ancho: 30, alto: 30 },
              { _id: 'gen-9', nombre: 'B9', x: 180, y: 190, ancho: 30, alto: 30 },
              { _id: 'gen-10', nombre: 'B10', x: 220, y: 190, ancho: 30, alto: 30 },
              { _id: 'gen-11', nombre: 'B11', x: 260, y: 190, ancho: 30, alto: 30 },
              { _id: 'gen-12', nombre: 'B12', x: 300, y: 190, ancho: 30, alto: 30 }
            ]
          },
          {
            id: 3,
            nombre: 'Zona Económica',
            asientos: [
              { _id: 'eco-1', nombre: 'C1', x: 100, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-2', nombre: 'C2', x: 140, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-3', nombre: 'C3', x: 180, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-4', nombre: 'C4', x: 220, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-5', nombre: 'C5', x: 260, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-6', nombre: 'C6', x: 300, y: 230, ancho: 30, alto: 30 },
              { _id: 'eco-7', nombre: 'C7', x: 100, y: 270, ancho: 30, alto: 30 },
              { _id: 'eco-8', nombre: 'C8', x: 140, y: 270, ancho: 30, alto: 30 },
              { _id: 'eco-9', nombre: 'C9', x: 180, y: 270, ancho: 30, alto: 30 },
              { _id: 'eco-10', nombre: 'C10', x: 220, y: 270, ancho: 30, alto: 30 },
              { _id: 'eco-11', nombre: 'C11', x: 260, y: 270, ancho: 30, alto: 30 },
              { _id: 'eco-12', nombre: 'C12', x: 300, y: 270, ancho: 30, alto: 30 }
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

    console.log('🎉 Datos de prueba para eventos insertados correctamente');
    console.log('📋 Resumen:');
    console.log(`   - Recinto ID: ${recinto.id}`);
    console.log(`   - Evento ID: ${evento.id} (slug: ${evento.slug})`);
    console.log(`   - Sala ID: ${sala.id}`);
    console.log(`   - Función ID: ${funcion.id}`);
    console.log(`   - Mapa ID: ${mapa.id}`);
    console.log(`   - Zonas: ${zonas.length}`);
    console.log(`   - Plantilla ID: ${plantilla.id}`);
    console.log('');
    console.log('🌐 URLs de prueba:');
    console.log(`   - Página del evento: https://zeatingmaps-ekirmens-projects.vercel.app/store/eventos/gg`);
    console.log(`   - Mapa del evento: https://zeatingmaps-ekirmens-projects.vercel.app/store/eventos/gg/map?funcion=${funcion.id}`);

  } catch (error) {
    console.error('❌ Error insertando datos de prueba para eventos:', error);
  }
}

insertEventosTestData(); 