// Script para debuggear la carga de imágenes en el editor
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugImageLoading() {
  console.log('🔍 [DEBUG] Iniciando debug de carga de imágenes...');
  
  try {
    // 1. Verificar que el mapa existe
    console.log('📋 [DEBUG] 1. Verificando mapa ID 149...');
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [DEBUG] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('✅ [DEBUG] Mapa encontrado:', {
      id: mapa.id,
      nombre: mapa.nombre,
      tieneContenido: !!mapa.contenido,
      elementosCount: mapa.contenido?.elementos?.length || 0
    });
    
    // 2. Analizar elementos del mapa
    console.log('📋 [DEBUG] 2. Analizando elementos del mapa...');
    const elementos = mapa.contenido?.elementos || [];
    const elementosConImagen = elementos.filter(el => el.type === 'background' && el.imageDataRef);
    
    console.log('📊 [DEBUG] Elementos con imageDataRef:', elementosConImagen.length);
    elementosConImagen.forEach((el, index) => {
      console.log(`  ${index + 1}. ID: ${el._id}, imageDataRef: ${el.imageDataRef}`);
    });
    
    // 3. Verificar tabla de imágenes optimizadas
    console.log('📋 [DEBUG] 3. Verificando tabla mapas_imagenes_fondo...');
    const { data: imagenes, error: imagenesError } = await supabase
      .from('mapas_imagenes_fondo')
      .select('*')
      .eq('mapa_id', 149);
    
    if (imagenesError) {
      console.error('❌ [DEBUG] Error obteniendo imágenes:', imagenesError);
    } else {
      console.log('✅ [DEBUG] Imágenes en BD:', imagenes.length);
      imagenes.forEach((img, index) => {
        console.log(`  ${index + 1}. Elemento: ${img.elemento_id}, Tamaño original: ${img.imagen_original?.length || 0}, Tamaño comprimido: ${img.imagen_compressed?.length || 0}`);
      });
    }
    
    // 4. Probar función RPC de restauración
    if (elementosConImagen.length > 0) {
      console.log('📋 [DEBUG] 4. Probando función RPC get_mapa_imagen_original...');
      const primerElemento = elementosConImagen[0];
      
      const { data: imagenOriginal, error: rpcError } = await supabase.rpc('get_mapa_imagen_original', {
        mapa_id_param: 149,
        elemento_id_param: primerElemento.imageDataRef
      });
      
      if (rpcError) {
        console.error('❌ [DEBUG] Error en RPC get_mapa_imagen_original:', rpcError);
      } else {
        console.log('✅ [DEBUG] Imagen original obtenida:', {
          tieneImagen: !!imagenOriginal?.imagen_original,
          tamaño: imagenOriginal?.imagen_original?.length || 0
        });
      }
    }
    
    // 5. Probar función de restauración completa
    console.log('📋 [DEBUG] 5. Probando función restore_mapa_imagen_completa_for_editing...');
    const { data: elementosRestaurados, error: restoreError } = await supabase.rpc('restore_mapa_imagen_completa_for_editing', {
      mapa_id_param: 149,
      elementos_json: elementos
    });
    
    if (restoreError) {
      console.error('❌ [DEBUG] Error en RPC restore_mapa_imagen_completa_for_editing:', restoreError);
    } else {
      console.log('✅ [DEBUG] Elementos restaurados:', {
        elementosCount: elementosRestaurados?.length || 0,
        elementosConImageData: elementosRestaurados?.filter(el => el.imageData)?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Error general:', error);
  }
}

debugImageLoading();
