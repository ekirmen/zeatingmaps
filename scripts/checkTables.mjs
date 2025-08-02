// Script para verificar las tablas existentes en Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bXlxb2R3d3dkd2pkb2R6ZWJjcCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1NzI5NzIwLCJleHAiOjIwNTEzMDU3MjB9.2QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas existentes...');

    // Lista de tablas que deberían existir
    const tables = [
      'recintos',
      'salas', 
      'zonas',
      'mapas',
      'eventos',
      'funciones',
      'seats',
      'plantillas',
      'profiles',
      'profiles_with_auth'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: Existe (${data?.length || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`);
      }
    }

    // Verificar datos específicos
    console.log('\n📊 Verificando datos existentes...');

    // Verificar recintos
    const { data: recintos } = await supabase.from('recintos').select('*');
    console.log(`🏢 Recintos: ${recintos?.length || 0}`);

    // Verificar salas
    const { data: salas } = await supabase.from('salas').select('*');
    console.log(`🎭 Salas: ${salas?.length || 0}`);

    // Verificar mapas
    const { data: mapas } = await supabase.from('mapas').select('*');
    console.log(`🗺️ Mapas: ${mapas?.length || 0}`);

    // Verificar eventos
    const { data: eventos } = await supabase.from('eventos').select('*');
    console.log(`🎪 Eventos: ${eventos?.length || 0}`);

    // Verificar funciones
    const { data: funciones } = await supabase.from('funciones').select('*');
    console.log(`🎬 Funciones: ${funciones?.length || 0}`);

    // Verificar asientos
    const { data: asientos } = await supabase.from('seats').select('*');
    console.log(`💺 Asientos: ${asientos?.length || 0}`);

    if (mapas && mapas.length > 0) {
      console.log('\n📋 Ejemplo de mapa:');
      console.log(JSON.stringify(mapas[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkTables(); 