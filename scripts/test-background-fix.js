// Script para probar la corrección del sistema de background
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackgroundFix() {
  console.log('🔍 [TEST] Probando corrección del sistema de background...');
  
  try {
    // 1. Verificar el mapa actual
    console.log('📋 [TEST] 1. Verificando mapa ID 149...');
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [TEST] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('✅ [TEST] Mapa encontrado:', {
      id: mapa.id,
      nombre: mapa.nombre,
      tieneContenido: !!mapa.contenido
    });
    
    // 2. Parsear contenido y buscar elementos de background
    let contenidoParseado;
    if (typeof mapa.contenido === 'string') {
      contenidoParseado = JSON.parse(mapa.contenido);
    } else {
      contenidoParseado = mapa.contenido;
    }
    
    const elementos = contenidoParseado?.elementos || [];
    const elementosBackground = elementos.filter(el => el.type === 'background');
    
    console.log('📊 [TEST] Elementos de background encontrados:', elementosBackground.length);
    
    elementosBackground.forEach((el, index) => {
      console.log(`  ${index + 1}. ID: ${el._id}`);
      console.log(`     - Tiene imageData: ${!!el.imageData}`);
      console.log(`     - Tiene imageDataRef: ${!!el.imageDataRef}`);
      console.log(`     - Tiene image: ${!!el.image}`);
      console.log(`     - Tamaño imageData: ${el.imageData?.length || 0}`);
    });
    
    // 3. Verificar si hay imágenes en la tabla de optimización
    console.log('📋 [TEST] 2. Verificando tabla mapas_imagenes_fondo...');
    const { data: imagenes, error: imagenesError } = await supabase
      .from('mapas_imagenes_fondo')
      .select('*')
      .eq('mapa_id', 149);
    
    if (imagenesError) {
      console.error('❌ [TEST] Error obteniendo imágenes:', imagenesError);
    } else {
      console.log('✅ [TEST] Imágenes en BD:', imagenes.length);
      imagenes.forEach((img, index) => {
        console.log(`  ${index + 1}. Elemento: ${img.elemento_id}`);
        console.log(`     - Tamaño original: ${img.imagen_original?.length || 0} bytes`);
        console.log(`     - Tamaño comprimido: ${img.imagen_compressed?.length || 0} bytes`);
        console.log(`     - Ratio compresión: ${img.imagen_compressed?.length && img.imagen_original?.length ? 
          ((img.imagen_compressed.length / img.imagen_original.length) * 100).toFixed(1) + '%' : 'N/A'}`);
      });
    }
    
    // 4. Probar función de restauración
    console.log('📋 [TEST] 3. Probando restauración de imágenes...');
    
    if (imagenes.length > 0) {
      const primeraImagen = imagenes[0];
      
      // Probar get_mapa_imagen_compressed
      const { data: imagenComprimida, error: compressedError } = await supabase.rpc('get_mapa_imagen_compressed', {
        mapa_id_param: 149,
        elemento_id_param: primeraImagen.elemento_id
      });
      
      if (compressedError) {
        console.error('❌ [TEST] Error obteniendo imagen comprimida:', compressedError);
      } else {
        console.log('✅ [TEST] Imagen comprimida obtenida:', {
          tieneImagen: !!imagenComprimida,
          tamaño: imagenComprimida?.length || 0,
          esBase64: imagenComprimida?.startsWith('data:') || false
        });
      }
    }
    
    // 5. Resumen del estado
    console.log('\n📊 [RESUMEN] Estado del sistema de background:');
    console.log(`  - Elementos de background en mapa: ${elementosBackground.length}`);
    console.log(`  - Elementos con imageData: ${elementosBackground.filter(el => el.imageData).length}`);
    console.log(`  - Elementos con imageDataRef: ${elementosBackground.filter(el => el.imageDataRef).length}`);
    console.log(`  - Imágenes en tabla de optimización: ${imagenes.length}`);
    
    if (elementosBackground.length > 0 && imagenes.length > 0) {
      console.log('✅ [RESULTADO] Sistema de background configurado correctamente');
      console.log('💡 [RECOMENDACIÓN] Probar subir una nueva imagen para verificar el flujo completo');
    } else if (elementosBackground.length > 0 && imagenes.length === 0) {
      console.log('⚠️ [PROBLEMA] Hay elementos de background pero no hay imágenes optimizadas');
      console.log('💡 [SOLUCIÓN] Guardar el mapa para activar la optimización');
    } else {
      console.log('ℹ️ [INFO] No hay elementos de background en este mapa');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error general:', error);
  }
}

testBackgroundFix();
