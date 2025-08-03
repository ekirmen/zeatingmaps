import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMapaSeatsConflict() {
  try {
    console.log('🔍 Analizando conflicto entre mapa y asientos...');
    
    // 1. Obtener el mapa de la sala 7
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', 7)
      .single();

    if (mapaError) {
      console.error('Error al obtener mapa:', mapaError);
      return;
    }

    console.log('📋 Mapa encontrado:', {
      id: mapa.id,
      sala_id: mapa.sala_id,
      contenido_length: mapa.contenido ? mapa.contenido.length : 0
    });

    // 2. Obtener todas las funciones de la sala 7
    const { data: funciones, error: funcError } = await supabase
      .from('funciones')
      .select('id')
      .eq('sala', 7);

    if (funcError) {
      console.error('Error al obtener funciones:', funcError);
      return;
    }

    console.log('📋 Funciones encontradas:', funciones.map(f => f.id));

    // 3. Obtener todos los asientos existentes para estas funciones
    const { data: existingSeats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .in('funcion_id', funciones.map(f => f.id));

    if (seatsError) {
      console.error('Error al obtener asientos:', seatsError);
      return;
    }

    console.log(`📊 Asientos existentes: ${existingSeats.length}`);

    // 4. Analizar el contenido del mapa
    if (!mapa.contenido || !Array.isArray(mapa.contenido)) {
      console.error('El mapa no tiene contenido válido');
      return;
    }

    const seatDefs = [];
    mapa.contenido.forEach(el => {
      if (el.type === 'mesa') {
        (el.sillas || []).forEach(s => {
          if (s._id) {
            seatDefs.push({ 
              id: s._id, 
              zona: s.zona || null,
              funcion_id_in_map: s.funcion_id // Esto puede ser el problema
            });
          }
        });
      } else if (el.type === 'silla') {
        if (el._id) {
          seatDefs.push({ 
            id: el._id, 
            zona: el.zona || null,
            funcion_id_in_map: el.funcion_id
          });
        }
      }
    });

    console.log(`📋 Asientos definidos en mapa: ${seatDefs.length}`);
    
    // Mostrar asientos con funcion_id en el mapa
    const seatsWithFuncionId = seatDefs.filter(s => s.funcion_id_in_map);
    console.log('🚨 Asientos con funcion_id en mapa:', seatsWithFuncionId.length);
    seatsWithFuncionId.forEach(s => {
      console.log(`  - ${s.id} -> funcion_id: ${s.funcion_id_in_map}`);
    });

    // 5. Limpiar asientos existentes que tengan conflictos
    const conflictedSeats = existingSeats.filter(seat => 
      seatDefs.some(def => def.id === seat._id && def.funcion_id_in_map && def.funcion_id_in_map !== seat.funcion_id)
    );

    if (conflictedSeats.length > 0) {
      console.log(`🗑️ Eliminando ${conflictedSeats.length} asientos conflictivos...`);
      
      const conflictedIds = conflictedSeats.map(s => s.id);
      const { error: deleteError } = await supabase
        .from('seats')
        .delete()
        .in('id', conflictedIds);

      if (deleteError) {
        console.error('Error al eliminar asientos conflictivos:', deleteError);
        return;
      }

      console.log('✅ Asientos conflictivos eliminados');
    }

    // 6. Limpiar funcion_id del mapa (opcional)
    console.log('🧹 Limpiando funcion_id del mapa...');
    const cleanedContenido = JSON.parse(JSON.stringify(mapa.contenido));
    
    let cleaned = false;
    cleanedContenido.forEach(el => {
      if (el.type === 'mesa') {
        (el.sillas || []).forEach(s => {
          if (s.funcion_id) {
            delete s.funcion_id;
            cleaned = true;
          }
        });
      } else if (el.type === 'silla') {
        if (el.funcion_id) {
          delete el.funcion_id;
          cleaned = true;
        }
      }
    });

    if (cleaned) {
      const { error: updateError } = await supabase
        .from('mapas')
        .update({ contenido: cleanedContenido })
        .eq('id', mapa.id);

      if (updateError) {
        console.error('Error al actualizar mapa:', updateError);
      } else {
        console.log('✅ Mapa limpiado de funcion_id');
      }
    }

    // 7. Verificar resultado final
    const { data: finalSeats, error: finalError } = await supabase
      .from('seats')
      .select('*')
      .in('funcion_id', funciones.map(f => f.id));

    if (finalError) {
      console.error('Error al verificar resultado:', finalError);
      return;
    }

    console.log(`📊 Total de asientos después de limpieza: ${finalSeats.length}`);

    // Verificar duplicados
    const duplicates = [];
    const seen = new Set();
    finalSeats.forEach(seat => {
      const key = `${seat.funcion_id}-${seat._id}`;
      if (seen.has(key)) {
        duplicates.push(seat);
      } else {
        seen.add(key);
      }
    });

    console.log(`🚨 Duplicados restantes: ${duplicates.length}`);

  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar el script
fixMapaSeatsConflict()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 