// Script para debuggear el contenido completo del mapa
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMapContent() {
  console.log('🔍 [DEBUG] Debuggeando contenido completo del mapa...');
  
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
    console.log('  - Tamaño del contenido:', mapa.contenido?.length || 0);
    
    // Parsear contenido
    let contenidoParseado;
    if (typeof mapa.contenido === 'string') {
      try {
        contenidoParseado = JSON.parse(mapa.contenido);
        console.log('✅ [DEBUG] Contenido parseado exitosamente');
      } catch (error) {
        console.error('❌ [DEBUG] Error parseando contenido:', error);
        return;
      }
    } else {
      contenidoParseado = mapa.contenido;
    }
    
    console.log('📊 [DEBUG] Estructura del contenido:');
    console.log('  - Tiene elementos:', !!contenidoParseado?.elementos);
    console.log('  - Cantidad de elementos:', contenidoParseado?.elementos?.length || 0);
    console.log('  - Tiene configuración:', !!contenidoParseado?.configuracion);
    
    if (contenidoParseado?.elementos) {
      console.log('\n📋 [DEBUG] Elementos del mapa:');
      contenidoParseado.elementos.forEach((elemento, index) => {
        console.log(`  ${index + 1}. ID: ${elemento._id}`);
        console.log(`     - Tipo: ${elemento.type}`);
        console.log(`     - Posición: x=${elemento.x || elemento.posicion?.x || 'N/A'}, y=${elemento.y || elemento.posicion?.y || 'N/A'}`);
        
        if (elemento.type === 'background') {
          console.log(`     - Tiene imageData: ${!!elemento.imageData}`);
          console.log(`     - Tiene imageDataRef: ${!!elemento.imageDataRef}`);
          console.log(`     - Tamaño imageData: ${elemento.imageData?.length || 0}`);
          console.log(`     - imageDataRef: ${elemento.imageDataRef || 'N/A'}`);
        }
      });
    }
    
    // Verificar si hay elementos de background
    const elementosBackground = contenidoParseado?.elementos?.filter(el => el.type === 'background') || [];
    console.log(`\n🖼️ [DEBUG] Elementos de background: ${elementosBackground.length}`);
    
    if (elementosBackground.length === 0) {
      console.log('⚠️ [PROBLEMA] No hay elementos de background en el mapa');
      console.log('💡 [SOLUCIÓN] Necesitas subir una imagen de background en el editor');
    } else {
      console.log('✅ [DEBUG] Elementos de background encontrados');
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Error general:', error);
  }
}

debugMapContent();
