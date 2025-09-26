// Script para limpiar el contenido del mapa y probar el flujo
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMapContent() {
  console.log('🧹 [CLEAN] Limpiando contenido del mapa...');
  
  try {
    // Obtener el mapa actual
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('id', 149)
      .single();
    
    if (mapaError) {
      console.error('❌ [CLEAN] Error obteniendo mapa:', mapaError);
      return;
    }
    
    console.log('📋 [CLEAN] Mapa actual:');
    console.log('  - ID:', mapa.id);
    console.log('  - Contenido actual:', Array.isArray(mapa.contenido) ? `Array(${mapa.contenido.length})` : typeof mapa.contenido);
    
    // Crear contenido limpio con solo los elementos necesarios
    const contenidoLimpio = {
      elementos: [
        {
          _id: "mesa_1755825679579",
          fill: "#f0f0f0",
          type: "mesa",
          zona: {
            id: 23,
            color: "#00f1f5",
            nombre: "PLATA"
          },
          shape: "rect",
          width: 150,
          height: 128,
          nombre: "Mesa 12",
          posicion: { x: 336, y: 189 },
          rotation: 0
        },
        {
          _id: "silla_1758894264060_4",
          fill: "#00d6a4",
          side: "top",
          type: "silla",
          zona: {
            id: 23,
            color: "#00f1f5",
            nombre: "PLATA"
          },
          empty: false,
          shape: "circle",
          mesaId: "mesa_1755825679579",
          nombre: "",
          numero: 1,
          radius: 10,
          posicion: { x: 361, y: 164 },
          sideCount: 5,
          sideIndex: 0
        }
      ],
      configuracion: {
        scale: 1.1,
        gridSize: 21,
        showGrid: true,
        stagePos: { x: 0, y: 0 },
        snapToGrid: true,
        seatSpacing: 25,
        backgroundScale: 0.9,
        backgroundOpacity: 1
      }
    };
    
    console.log('🧹 [CLEAN] Contenido limpio creado:');
    console.log('  - Elementos:', contenidoLimpio.elementos.length);
    console.log('  - Configuración:', !!contenidoLimpio.configuracion);
    
    // Actualizar el mapa con contenido limpio
    const { data: mapaActualizado, error: updateError } = await supabase
      .from('mapas')
      .update({ 
        contenido: contenidoLimpio,
        updated_at: new Date().toISOString()
      })
      .eq('id', 149)
      .select();
    
    if (updateError) {
      console.error('❌ [CLEAN] Error actualizando mapa:', updateError);
      return;
    }
    
    console.log('✅ [CLEAN] Mapa actualizado exitosamente');
    console.log('📋 [CLEAN] Nuevo contenido:');
    console.log('  - Tipo:', typeof mapaActualizado[0].contenido);
    console.log('  - Tiene elementos:', !!mapaActualizado[0].contenido.elementos);
    console.log('  - Cantidad de elementos:', mapaActualizado[0].contenido.elementos?.length || 0);
    
    // Limpiar también la tabla de imágenes optimizadas
    console.log('🧹 [CLEAN] Limpiando tabla mapas_imagenes_fondo...');
    const { error: deleteError } = await supabase
      .from('mapas_imagenes_fondo')
      .delete()
      .eq('mapa_id', 149);
    
    if (deleteError) {
      console.error('❌ [CLEAN] Error limpiando imágenes:', deleteError);
    } else {
      console.log('✅ [CLEAN] Tabla de imágenes limpiada');
    }
    
    console.log('🎯 [CLEAN] Mapa limpio y listo para probar');
    console.log('💡 [CLEAN] Ahora puedes subir una nueva imagen de background en el editor');
    
  } catch (error) {
    console.error('❌ [CLEAN] Error general:', error);
  }
}

cleanMapContent();
