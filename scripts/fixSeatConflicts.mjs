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

async function fixSeatConflicts() {
  try {
    console.log('🔍 Analizando conflictos de asientos...');
    
    // 1. Obtener todos los asientos
    const { data: allSeats, error: fetchError } = await supabase
      .from('seats')
      .select('*')
      .order('funcion_id')
      .order('_id');

    if (fetchError) {
      console.error('Error al obtener asientos:', fetchError);
      return;
    }

    console.log(`📊 Total de asientos encontrados: ${allSeats.length}`);

    // 2. Identificar duplicados por funcion_id y _id
    const duplicates = [];
    const seen = new Set();

    allSeats.forEach(seat => {
      const key = `${seat.funcion_id}-${seat._id}`;
      if (seen.has(key)) {
        duplicates.push(seat);
      } else {
        seen.add(key);
      }
    });

    console.log(`🚨 Duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length > 0) {
      // Mostrar información de duplicados
      console.log('\n📋 Duplicados encontrados:');
      duplicates.forEach((seat, index) => {
        console.log(`${index + 1}. Funcion ID: ${seat.funcion_id}, Seat ID: ${seat._id}, Status: ${seat.status}`);
      });

      // Eliminar duplicados (mantener solo el primero)
      const duplicateIds = duplicates.map(seat => seat.id);
      
      console.log('\n🗑️ Eliminando duplicados...');
      const { error: deleteError } = await supabase
        .from('seats')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        console.error('Error al eliminar duplicados:', deleteError);
        return;
      }

      console.log(`✅ Se eliminaron ${duplicates.length} asientos duplicados`);
    }

    // 3. Limpiar funcion_id del mapa
    console.log('\n🧹 Limpiando funcion_id del mapa...');
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', 7)
      .single();

    if (mapaError) {
      console.error('Error al obtener mapa:', mapaError);
      return;
    }

    if (mapa && mapa.contenido) {
      // Limpiar funcion_id del contenido del mapa
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
    }

    // 4. Verificar resultado final
    const { data: finalSeats, error: finalError } = await supabase
      .from('seats')
      .select('*');

    if (finalError) {
      console.error('Error al verificar resultado:', finalError);
      return;
    }

    console.log(`📊 Total de asientos después de limpieza: ${finalSeats.length}`);

    // Verificar duplicados finales
    const finalDuplicates = [];
    const finalSeen = new Set();
    finalSeats.forEach(seat => {
      const key = `${seat.funcion_id}-${seat._id}`;
      if (finalSeen.has(key)) {
        finalDuplicates.push(seat);
      } else {
        finalSeen.add(key);
      }
    });

    console.log(`🚨 Duplicados restantes: ${finalDuplicates.length}`);

    if (finalDuplicates.length === 0) {
      console.log('✅ No hay duplicados restantes');
    }

  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar el script
fixSeatConflicts()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 