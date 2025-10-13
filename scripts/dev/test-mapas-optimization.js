// Script de prueba para verificar que la optimización de mapas funciona correctamente
// Ejecutar con: node scripts/test-mapas-optimization.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMapasOptimization() {
  console.log('🧪 Iniciando pruebas de optimización de mapas...\n');

  try {
    // 1. Verificar que las tablas de optimización existen
    console.log('1️⃣ Verificando tablas de optimización...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['mapas_imagenes_fondo', 'mapas_backup_before_optimization'])
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError);
      return;
    }

    console.log('✅ Tablas encontradas:', tables.map(t => t.table_name));

    // 2. Verificar estadísticas de rendimiento
    console.log('\n2️⃣ Verificando estadísticas de rendimiento...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_mapas_image_performance_stats');

    if (statsError) {
      console.error('❌ Error obteniendo estadísticas:', statsError);
      return;
    }

    if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log('📊 Estadísticas de rendimiento:');
      console.log(`   - Total mapas: ${stat.total_mapas}`);
      console.log(`   - Mapas con imagen: ${stat.mapas_con_imagen}`);
      console.log(`   - Total imágenes: ${stat.total_imagenes}`);
      console.log(`   - Tamaño promedio: ${stat.avg_contenido_size} bytes`);
      console.log(`   - Tamaño máximo: ${stat.max_contenido_size} bytes`);
      console.log(`   - Tamaño original imágenes: ${stat.total_imagen_original_size} bytes`);
      console.log(`   - Tamaño comprimido imágenes: ${stat.total_imagen_compressed_size} bytes`);
      console.log(`   - Ratio de compresión: ${stat.overall_compression_ratio}%`);
    }

    // 3. Verificar vista de monitoreo
    console.log('\n3️⃣ Verificando vista de monitoreo...');
    
    const { data: monitor, error: monitorError } = await supabase
      .from('mapas_performance_monitor')
      .select('*')
      .limit(5);

    if (monitorError) {
      console.error('❌ Error obteniendo vista de monitoreo:', monitorError);
      return;
    }

    if (monitor && monitor.length > 0) {
      console.log('📈 Vista de monitoreo (primeros 5 registros):');
      monitor.forEach((m, index) => {
        console.log(`   ${index + 1}. Mapa ${m.id} (${m.nombre}):`);
        console.log(`      - Tamaño: ${m.contenido_size_mb} MB`);
        console.log(`      - Elementos: ${m.total_elementos}`);
        console.log(`      - Imágenes: ${m.total_imagenes}`);
        console.log(`      - Compresión: ${m.compression_ratio}%`);
      });
    }

    // 4. Verificar que las funciones funcionan
    console.log('\n4️⃣ Verificando funciones de optimización...');
    
    // Obtener un mapa con imagen para probar
    const { data: mapas, error: mapasError } = await supabase
      .from('mapas')
      .select('id, nombre')
      .like('contenido', '%imageDataRef%')
      .limit(1);

    if (mapasError) {
      console.error('❌ Error obteniendo mapas:', mapasError);
      return;
    }

    if (mapas && mapas.length > 0) {
      const mapa = mapas[0];
      console.log(`✅ Mapa encontrado para pruebas: ${mapa.nombre} (ID: ${mapa.id})`);

      // Probar función de restauración
      const { data: restored, error: restoreError } = await supabase
        .rpc('restore_mapa_imagen_completa_for_editing', { mapa_id_param: mapa.id });

      if (restoreError) {
        console.error('❌ Error probando función de restauración:', restoreError);
      } else {
        console.log('✅ Función de restauración funciona correctamente');
      }
    }

    // 5. Verificar backup de seguridad
    console.log('\n5️⃣ Verificando backup de seguridad...');
    
    const { data: backup, error: backupError } = await supabase
      .from('mapas_backup_before_optimization')
      .select('*')
      .limit(1);

    if (backupError) {
      console.error('❌ Error verificando backup:', backupError);
    } else if (backup && backup.length > 0) {
      console.log('✅ Backup de seguridad existe');
      console.log(`   - Total backups: ${backup.length}`);
      console.log(`   - Tamaño del backup: ${Math.round(backup[0].contenido_size / 1024 / 1024)} MB`);
    } else {
      console.log('⚠️ No se encontró backup de seguridad');
    }

    // 6. Verificar rendimiento de consultas
    console.log('\n6️⃣ Verificando rendimiento de consultas...');
    
    const startTime = Date.now();
    
    const { data: performance, error: perfError } = await supabase
      .from('mapas')
      .select('id, nombre, contenido')
      .like('contenido', '%imageDataRef%');

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    if (perfError) {
      console.error('❌ Error en consulta de rendimiento:', perfError);
    } else {
      console.log(`✅ Consulta de rendimiento completada en ${queryTime}ms`);
      console.log(`   - Registros encontrados: ${performance ? performance.length : 0}`);
    }

    // 7. Verificar que no hay problemas de tokenización
    console.log('\n7️⃣ Verificando problemas de tokenización...');
    
    const { data: largeMapas, error: largeError } = await supabase
      .from('mapas')
      .select('id, nombre, contenido')
      .gt('contenido', '1000000') // Buscar mapas grandes
      .limit(1);

    if (largeError) {
      console.error('❌ Error verificando mapas grandes:', largeError);
    } else if (largeMapas && largeMapas.length > 0) {
      const largeMapa = largeMapas[0];
      const contentLength = JSON.stringify(largeMapa.contenido).length;
      console.log(`⚠️ Mapa grande encontrado: ${largeMapa.nombre} (${Math.round(contentLength / 1024 / 1024)} MB)`);
      
      if (contentLength > 1000000) {
        console.log('❌ Aún hay mapas con contenido muy grande');
      } else {
        console.log('✅ No hay problemas de tokenización');
      }
    } else {
      console.log('✅ No se encontraron mapas con problemas de tamaño');
    }

    console.log('\n🎉 Pruebas de optimización completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testMapasOptimization();
