import { createClient } from '@supabase/supabase-js';

// Usar las variables de entorno correctas para Vercel
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno de Supabase');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Iniciando limpieza de conflictos de asientos...');
    
    // Verificar conexión a Supabase
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Configuración de Supabase incompleta',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      });
    }
    
    // 1. Obtener todos los asientos
    const { data: allSeats, error: fetchError } = await supabase
      .from('seats')
      .select('*')
      .order('funcion_id')
      .order('_id');

    if (fetchError) {
      console.error('Error al obtener asientos:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    console.log(`📊 Total de asientos encontrados: ${allSeats.length}`);

    // 2. Identificar duplicados por _id (clave primaria)
    const duplicates = [];
    const seen = new Set();

    allSeats.forEach(seat => {
      if (seen.has(seat._id)) {
        duplicates.push(seat);
      } else {
        seen.add(seat._id);
      }
    });

    console.log(`🚨 Duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length > 0) {
      // Mostrar información de duplicados
      console.log('\n📋 Duplicados encontrados:');
      duplicates.forEach((seat, index) => {
        console.log(`${index + 1}. ID: ${seat.id}, _id: ${seat._id}, Funcion ID: ${seat.funcion_id}, Status: ${seat.status}`);
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
        return res.status(500).json({ error: deleteError.message });
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
      return res.status(500).json({ error: mapaError.message });
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
          return res.status(500).json({ error: updateError.message });
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
      return res.status(500).json({ error: finalError.message });
    }

    console.log(`📊 Total de asientos después de limpieza: ${finalSeats.length}`);

    // Verificar duplicados finales
    const finalDuplicates = [];
    const finalSeen = new Set();
    finalSeats.forEach(seat => {
      if (finalSeen.has(seat._id)) {
        finalDuplicates.push(seat);
      } else {
        finalSeen.add(seat._id);
      }
    });

    console.log(`🚨 Duplicados restantes: ${finalDuplicates.length}`);

    return res.status(200).json({
      success: true,
      message: 'Limpieza completada',
      totalSeats: finalSeats.length,
      duplicatesRemoved: duplicates.length,
      remainingDuplicates: finalDuplicates.length,
      mapCleaned: cleaned
    });

  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
} 