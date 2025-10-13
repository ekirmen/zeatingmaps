// Script para debuggear la estructura del contenido del mapa
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMapContentStructure() {
  console.log('🔍 [DEBUG] Debuggeando estructura del contenido del mapa...');
  
  try {
    // Obtener el mapa
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [DEBUG] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('📋 [DEBUG] Mapa encontrado:');
    console.log('  - ID:', mapa.id);
    console.log('  - Nombre:', mapa.nombre);
    console.log('  - Tiene contenido:', !!mapa.contenido);
    console.log('  - Tipo de contenido:', typeof mapa.contenido);
    console.log('  - Es Array:', Array.isArray(mapa.contenido));
    console.log('  - Tamaño del contenido:', mapa.contenido?.length || 0);
    
    // Mostrar los primeros elementos del contenido
    if (Array.isArray(mapa.contenido)) {
      console.log('📊 [DEBUG] Primeros 5 elementos del array:');
      mapa.contenido.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index}:`, {
          tipo: typeof item,
          tieneId: !!item._id,
          tieneType: !!item.type,
          type: item.type,
          id: item._id
        });
      });
      
      // Buscar elementos de background
      const elementosBackground = mapa.contenido.filter(item => item.type === 'background');
      console.log(`🖼️ [DEBUG] Elementos de background encontrados: ${elementosBackground.length}`);
      
      elementosBackground.forEach((el, index) => {
        console.log(`  ${index + 1}. ID: ${el._id}`);
        console.log(`     - Tiene imageData: ${!!el.imageData}`);
        console.log(`     - Tiene imageDataRef: ${!!el.imageDataRef}`);
        console.log(`     - Tamaño imageData: ${el.imageData?.length || 0}`);
        console.log(`     - imageDataRef: ${el.imageDataRef || 'N/A'}`);
      });
    } else if (typeof mapa.contenido === 'object') {
      console.log('📊 [DEBUG] Contenido es un objeto:');
      console.log('  - Claves:', Object.keys(mapa.contenido));
      
      if (mapa.contenido.elementos) {
        console.log('  - Elementos:', mapa.contenido.elementos.length);
        const elementosBackground = mapa.contenido.elementos.filter(el => el.type === 'background');
        console.log(`  - Elementos de background: ${elementosBackground.length}`);
      }
    }
    
    // Verificar si hay imágenes en la tabla de optimización
    console.log('📋 [DEBUG] Verificando tabla mapas_imagenes_fondo...');
    const { data: imagenes, error: imagenesError } = await supabase
      .from('mapas_imagenes_fondo')
      .select('*')
      .eq('mapa_id', 149);
    
    if (imagenesError) {
      console.error('❌ [DEBUG] Error obteniendo imágenes:', imagenesError);
    } else {
      console.log('✅ [DEBUG] Imágenes en BD:', imagenes.length);
      imagenes.forEach((img, index) => {
        console.log(`  ${index + 1}. Elemento: ${img.elemento_id}`);
        console.log(`     - Tamaño original: ${img.imagen_original?.length || 0} bytes`);
        console.log(`     - Tamaño comprimido: ${img.imagen_compressed?.length || 0} bytes`);
      });
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Error general:', error);
  }
}

debugMapContentStructure();
