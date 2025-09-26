// Script para debuggear el contenido del mapa
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMapContent() {
  console.log('🔍 [DEBUG] Analizando contenido del mapa...');
  
  try {
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [DEBUG] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('📋 [DEBUG] Estructura del mapa:');
    console.log('  - ID:', mapa.id);
    console.log('  - Nombre:', mapa.nombre);
    console.log('  - Contenido type:', typeof mapa.contenido);
    console.log('  - Contenido keys:', Object.keys(mapa.contenido || {}));
    
    if (mapa.contenido) {
      console.log('📋 [DEBUG] Contenido completo:');
      console.log(JSON.stringify(mapa.contenido, null, 2));
    }
    
    // Verificar si contenido es un string que necesita parsing
    if (typeof mapa.contenido === 'string') {
      console.log('📋 [DEBUG] Contenido es string, intentando parsear...');
      try {
        const parsed = JSON.parse(mapa.contenido);
        console.log('✅ [DEBUG] Parseado exitosamente:');
        console.log('  - Type:', typeof parsed);
        console.log('  - Keys:', Object.keys(parsed || {}));
        if (parsed.elementos) {
          console.log('  - Elementos count:', parsed.elementos.length);
          const elementosConImagen = parsed.elementos.filter(el => el.type === 'background' && el.imageDataRef);
          console.log('  - Elementos con imageDataRef:', elementosConImagen.length);
        }
      } catch (parseError) {
        console.error('❌ [DEBUG] Error parseando contenido:', parseError);
      }
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Error general:', error);
  }
}

debugMapContent();
