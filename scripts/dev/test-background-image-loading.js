// Script para probar la carga de imágenes de background
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackgroundImageLoading() {
  console.log('🔍 [TEST] Probando carga de imágenes de background...');
  
  try {
    // 1. Verificar que el mapa existe
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
    
    // 2. Parsear contenido
    let contenidoParseado;
    if (typeof mapa.contenido === 'string') {
      contenidoParseado = JSON.parse(mapa.contenido);
    } else {
      contenidoParseado = mapa.contenido;
    }
    
    console.log('📋 [TEST] 2. Analizando elementos del mapa...');
    const elementos = contenidoParseado?.elementos || [];
    const elementosConImagen = elementos.filter(el => el.type === 'background' && el.imageDataRef);
    
    console.log('📊 [TEST] Elementos con imageDataRef:', elementosConImagen.length);
    elementosConImagen.forEach((el, index) => {
      console.log(`  ${index + 1}. ID: ${el._id}, imageDataRef: ${el.imageDataRef}`);
    });
    
    // 3. Verificar tabla de imágenes optimizadas
    console.log('📋 [TEST] 3. Verificando tabla mapas_imagenes_fondo...');
    const { data: imagenes, error: imagenesError } = await supabase
      .from('mapas_imagenes_fondo')
      .select('*')
      .eq('mapa_id', 149);
    
    if (imagenesError) {
      console.error('❌ [TEST] Error obteniendo imágenes:', imagenesError);
    } else {
      console.log('✅ [TEST] Imágenes en BD:', imagenes.length);
      imagenes.forEach((img, index) => {
        console.log(`  ${index + 1}. Elemento: ${img.elemento_id}, Tamaño original: ${img.imagen_original?.length || 0}, Tamaño comprimido: ${img.imagen_compressed?.length || 0}`);
      });
    }
    
    // 4. Probar función RPC de imagen comprimida
    if (elementosConImagen.length > 0) {
      console.log('📋 [TEST] 4. Probando función RPC get_mapa_imagen_compressed...');
      const primerElemento = elementosConImagen[0];
      
      const { data: imagenComprimida, error: rpcError } = await supabase.rpc('get_mapa_imagen_compressed', {
        mapa_id_param: 149,
        elemento_id_param: primerElemento.imageDataRef
      });
      
      if (rpcError) {
        console.error('❌ [TEST] Error en RPC get_mapa_imagen_compressed:', rpcError);
      } else {
        console.log('✅ [TEST] Imagen comprimida obtenida:', {
          tieneImagen: !!imagenComprimida,
          tamaño: imagenComprimida?.length || 0,
          esBase64: imagenComprimida?.startsWith('data:') || false
        });
      }
    }
    
    // 5. Probar función de restauración completa
    console.log('📋 [TEST] 5. Probando función restore_mapa_imagen_completa_for_editing...');
    const { data: elementosRestaurados, error: restoreError } = await supabase.rpc('restore_mapa_imagen_completa_for_editing', {
      mapa_id_param: 149,
      elementos_json: elementos
    });
    
    if (restoreError) {
      console.error('❌ [TEST] Error en RPC restore_mapa_imagen_completa_for_editing:', restoreError);
    } else {
      console.log('✅ [TEST] Elementos restaurados:', {
        elementosCount: elementosRestaurados?.length || 0,
        elementosConImageData: elementosRestaurados?.filter(el => el.imageData)?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error general:', error);
  }
}

testBackgroundImageLoading();
