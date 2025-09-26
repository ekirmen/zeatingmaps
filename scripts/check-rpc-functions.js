// Script para verificar funciones RPC disponibles
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPCFunctions() {
  console.log('🔍 [CHECK] Verificando funciones RPC disponibles...');
  
  try {
    // Probar función get_mapa_imagen_compressed
    console.log('📋 [CHECK] 1. Probando get_mapa_imagen_compressed...');
    const { data: compressed, error: compressedError } = await supabase.rpc('get_mapa_imagen_compressed', {
      mapa_id_param: 149,
      elemento_id_param: 'bg_1755825719428'
    });
    
    if (compressedError) {
      console.error('❌ [CHECK] Error en get_mapa_imagen_compressed:', compressedError);
    } else {
      console.log('✅ [CHECK] get_mapa_imagen_compressed funciona:', {
        tieneImagen: !!compressed,
        tamaño: compressed?.length || 0
      });
    }
    
    // Probar función get_mapa_imagen_original
    console.log('📋 [CHECK] 2. Probando get_mapa_imagen_original...');
    const { data: original, error: originalError } = await supabase.rpc('get_mapa_imagen_original', {
      mapa_id_param: 149,
      elemento_id_param: 'bg_1755825719428'
    });
    
    if (originalError) {
      console.error('❌ [CHECK] Error en get_mapa_imagen_original:', originalError);
    } else {
      console.log('✅ [CHECK] get_mapa_imagen_original funciona:', {
        tieneImagen: !!original,
        tamaño: original?.length || 0
      });
    }
    
    // Probar función optimize_mapa_after_editing
    console.log('📋 [CHECK] 3. Probando optimize_mapa_after_editing...');
    const { data: optimize, error: optimizeError } = await supabase.rpc('optimize_mapa_after_editing', {
      mapa_id_param: 149,
      nuevo_contenido: []
    });
    
    if (optimizeError) {
      console.error('❌ [CHECK] Error en optimize_mapa_after_editing:', optimizeError);
    } else {
      console.log('✅ [CHECK] optimize_mapa_after_editing funciona:', optimize);
    }
    
  } catch (error) {
    console.error('❌ [CHECK] Error general:', error);
  }
}

checkRPCFunctions();
