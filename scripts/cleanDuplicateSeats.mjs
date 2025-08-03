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

async function cleanDuplicateSeats() {
  try {
    console.log('🔍 Buscando asientos duplicados...');
    
    // Obtener todos los asientos
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

    // Agrupar por funcion_id y _id para encontrar duplicados
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

    console.log(`🚨 Asientos duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados');
      return;
    }

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

    // Verificar resultado final
    const { data: finalSeats, error: finalError } = await supabase
      .from('seats')
      .select('*');

    if (finalError) {
      console.error('Error al verificar resultado:', finalError);
      return;
    }

    console.log(`📊 Total de asientos después de limpieza: ${finalSeats.length}`);

  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutar el script
cleanDuplicateSeats()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 