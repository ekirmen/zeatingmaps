// Script para verificar el formato del contenido del mapa
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMapContentFormat() {
  console.log('🔍 [CHECK] Verificando formato del contenido del mapa...');
  
  try {
    // Obtener el mapa
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [CHECK] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('📋 [CHECK] Contenido del mapa:');
    console.log('  - Tipo:', typeof mapa.contenido);
    console.log('  - Valor:', JSON.stringify(mapa.contenido, null, 2));
    
    // Verificar si es un objeto válido
    if (typeof mapa.contenido === 'object') {
      console.log('✅ [CHECK] Contenido es un objeto');
      console.log('  - Claves:', Object.keys(mapa.contenido));
      
      if (mapa.contenido.elementos) {
        console.log('  - Elementos:', mapa.contenido.elementos.length);
      } else {
        console.log('  - No tiene elementos');
      }
    } else if (typeof mapa.contenido === 'string') {
      console.log('📝 [CHECK] Contenido es un string');
      try {
        const parsed = JSON.parse(mapa.contenido);
        console.log('✅ [CHECK] String parseado exitosamente');
        console.log('  - Claves:', Object.keys(parsed));
        if (parsed.elementos) {
          console.log('  - Elementos:', parsed.elementos.length);
        }
      } catch (error) {
        console.error('❌ [CHECK] Error parseando string:', error);
      }
    }
    
    // Verificar el historial de cambios
    console.log('\n📋 [CHECK] Verificando historial de cambios...');
    console.log('  - Creado:', mapa.created_at);
    console.log('  - Actualizado:', mapa.updated_at);
    
  } catch (error) {
    console.error('❌ [CHECK] Error general:', error);
  }
}

checkMapContentFormat();
