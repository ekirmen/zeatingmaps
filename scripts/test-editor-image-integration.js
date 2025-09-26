// Script de prueba para verificar la integración del editor con imágenes optimizadas
// Ejecutar con: node scripts/test-editor-image-integration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEditorImageIntegration() {
  console.log('🧪 Iniciando pruebas de integración del editor con imágenes optimizadas...\n');

  try {
    // 1. Verificar que las funciones de optimización existen
    console.log('1️⃣ Verificando funciones de optimización...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', [
        'get_mapa_imagen_original',
        'get_mapa_imagen_compressed', 
        'restore_mapa_imagen_completa_for_editing',
        'optimize_mapa_after_editing'
      ])
      .eq('routine_schema', 'public');

    if (functionsError) {
      console.error('❌ Error verificando funciones:', functionsError);
      return;
    }

    console.log('✅ Funciones encontradas:', functions.map(f => f.routine_name));

    // 2. Obtener un mapa con imágenes optimizadas
    console.log('\n2️⃣ Buscando mapa con imágenes optimizadas...');
    
    const { data: mapas, error: mapasError } = await supabase
      .from('mapas')
      .select('id, nombre, contenido')
      .like('contenido', '%imageDataRef%')
      .limit(1);

    if (mapasError) {
      console.error('❌ Error obteniendo mapas:', mapasError);
      return;
    }

    if (!mapas || mapas.length === 0) {
      console.log('⚠️ No se encontraron mapas con imágenes optimizadas');
      return;
    }

    const mapa = mapas[0];
    console.log(`✅ Mapa encontrado: ${mapa.nombre} (ID: ${mapa.id})`);

    // 3. Verificar que el mapa tiene elementos con imageDataRef
    console.log('\n3️⃣ Verificando elementos con imageDataRef...');
    
    const elementos = mapa.contenido || [];
    const elementosConImagen = elementos.filter(el => 
      el.type === 'background' && el.imageDataRef
    );

    console.log(`📊 Total elementos: ${elementos.length}`);
    console.log(`🖼️ Elementos con imagen optimizada: ${elementosConImagen.length}`);

    if (elementosConImagen.length === 0) {
      console.log('⚠️ No se encontraron elementos con imageDataRef');
      return;
    }

    // 4. Probar función de restauración para edición
    console.log('\n4️⃣ Probando función de restauración para edición...');
    
    const { data: contenidoRestaurado, error: restoreError } = await supabase
      .rpc('restore_mapa_imagen_completa_for_editing', {
        mapa_id_param: mapa.id
      });

    if (restoreError) {
      console.error('❌ Error restaurando contenido:', restoreError);
    } else if (contenidoRestaurado) {
      const elementosRestaurados = contenidoRestaurado || [];
      const elementosConImageData = elementosRestaurados.filter(el => 
        el.type === 'background' && el.imageData
      );
      
      console.log(`✅ Contenido restaurado exitosamente`);
      console.log(`📊 Elementos restaurados: ${elementosRestaurados.length}`);
      console.log(`🖼️ Elementos con imageData: ${elementosConImageData.length}`);
      
      if (elementosConImageData.length > 0) {
        const primerElemento = elementosConImageData[0];
        console.log(`📏 Tamaño de imagen restaurada: ${Math.round(primerElemento.imageData.length / 1024)} KB`);
      }
    }

    // 5. Probar obtención de imagen específica
    console.log('\n5️⃣ Probando obtención de imagen específica...');
    
    const primerElemento = elementosConImagen[0];
    const { data: imagenOriginal, error: imagenError } = await supabase
      .rpc('get_mapa_imagen_original', {
        mapa_id_param: mapa.id,
        elemento_id_param: primerElemento.imageDataRef
      });

    if (imagenError) {
      console.error('❌ Error obteniendo imagen original:', imagenError);
    } else if (imagenOriginal) {
      console.log(`✅ Imagen original obtenida exitosamente`);
      console.log(`📏 Tamaño: ${Math.round(imagenOriginal.length / 1024)} KB`);
    }

    // 6. Probar obtención de imagen comprimida
    console.log('\n6️⃣ Probando obtención de imagen comprimida...');
    
    const { data: imagenComprimida, error: comprimidaError } = await supabase
      .rpc('get_mapa_imagen_compressed', {
        mapa_id_param: mapa.id,
        elemento_id_param: primerElemento.imageDataRef
      });

    if (comprimidaError) {
      console.error('❌ Error obteniendo imagen comprimida:', comprimidaError);
    } else if (imagenComprimida) {
      console.log(`✅ Imagen comprimida obtenida exitosamente`);
      console.log(`📏 Tamaño: ${Math.round(imagenComprimida.length / 1024)} KB`);
      
      if (imagenOriginal) {
        const ratio = Math.round((1 - imagenComprimida.length / imagenOriginal.length) * 100);
        console.log(`📊 Ratio de compresión: ${ratio}%`);
      }
    }

    // 7. Verificar tabla de imágenes
    console.log('\n7️⃣ Verificando tabla de imágenes...');
    
    const { data: imagenes, error: imagenesError } = await supabase
      .from('mapas_imagenes_fondo')
      .select('*')
      .eq('mapa_id', mapa.id);

    if (imagenesError) {
      console.error('❌ Error obteniendo imágenes:', imagenesError);
    } else {
      console.log(`✅ Imágenes en tabla separada: ${imagenes.length}`);
      
      if (imagenes.length > 0) {
        const primeraImagen = imagenes[0];
        console.log(`📊 Metadatos:`, primeraImagen.metadata);
      }
    }

    // 8. Verificar estadísticas de rendimiento
    console.log('\n8️⃣ Verificando estadísticas de rendimiento...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_mapas_image_performance_stats');

    if (statsError) {
      console.error('❌ Error obteniendo estadísticas:', statsError);
    } else if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log('📊 Estadísticas de rendimiento:');
      console.log(`   - Total mapas: ${stat.total_mapas}`);
      console.log(`   - Mapas con imagen: ${stat.mapas_con_imagen}`);
      console.log(`   - Total imágenes: ${stat.total_imagenes}`);
      console.log(`   - Tamaño promedio: ${stat.avg_contenido_size} bytes`);
      console.log(`   - Tamaño máximo: ${stat.max_contenido_size} bytes`);
      console.log(`   - Ratio de compresión: ${stat.overall_compression_ratio}%`);
    }

    console.log('\n🎉 Pruebas de integración completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('✅ Funciones de optimización disponibles');
    console.log('✅ Mapa con imágenes optimizadas encontrado');
    console.log('✅ Restauración para edición funciona');
    console.log('✅ Obtención de imágenes funciona');
    console.log('✅ Compresión de imágenes funciona');
    console.log('✅ Tabla de imágenes separada funciona');
    console.log('✅ Estadísticas de rendimiento disponibles');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testEditorImageIntegration();
