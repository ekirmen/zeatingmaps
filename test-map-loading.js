const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (reemplaza con tus credenciales)
const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseKey = 'tu_supabase_anon_key'; // Reemplaza con tu clave real

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMapLoading() {
  console.log('=== PRUEBA DE CARGA DE MAPA ===\n');

  try {
    // 1. Verificar funciones disponibles
    console.log('1. Verificando funciones...');
    const { data: funciones, error: funcionesError } = await supabase
      .from('funciones')
      .select('*, sala(*)')
      .limit(5);
    
    if (funcionesError) {
      console.error('Error cargando funciones:', funcionesError);
      return;
    }
    
    console.log(`Funciones encontradas: ${funciones?.length || 0}`);
    funciones?.forEach(f => {
      console.log(`- ID: ${f.id}, Sala: ${f.sala?.nombre || 'Sin sala'}, Sala ID: ${f.sala?.id}`);
    });

    // 2. Verificar mapas disponibles
    console.log('\n2. Verificando mapas...');
    const { data: mapas, error: mapasError } = await supabase
      .from('mapas')
      .select('*')
      .limit(5);
    
    if (mapasError) {
      console.error('Error cargando mapas:', mapasError);
      return;
    }
    
    console.log(`Mapas encontrados: ${mapas?.length || 0}`);
    mapas?.forEach(m => {
      console.log(`- Sala ID: ${m.sala_id}`);
      if (m.contenido) {
        try {
          const contenido = typeof m.contenido === 'string' ? JSON.parse(m.contenido) : m.contenido;
          console.log(`  Contenido: ${JSON.stringify(contenido).substring(0, 200)}...`);
          
          // Verificar si hay mesas en el contenido
          if (contenido.mesas) {
            console.log(`  Mesas encontradas: ${contenido.mesas.length}`);
            contenido.mesas.forEach((mesa, i) => {
              console.log(`    Mesa ${i}: ${mesa.shape || 'rectangular'} - ${mesa.nombre || 'Sin nombre'}`);
            });
          }
          
          // Verificar si hay zonas
          if (contenido.zonas) {
            console.log(`  Zonas encontradas: ${contenido.zonas.length}`);
            contenido.zonas.forEach((zona, i) => {
              console.log(`    Zona ${i}: ${zona.nombre} - ${zona.asientos?.length || 0} asientos`);
            });
          }
        } catch (e) {
          console.log(`  Error parsing contenido: ${e.message}`);
        }
      }
    });

    // 3. Probar carga de mapa específico
    if (funciones?.length > 0) {
      const funcion = funciones[0];
      console.log(`\n3. Probando carga de mapa para función ${funcion.id}...`);
      
      const { data: mapa, error: mapaError } = await supabase
        .from('mapas')
        .select('contenido')
        .eq('sala_id', funcion.sala?.id)
        .single();
      
      if (mapaError) {
        console.error('Error cargando mapa específico:', mapaError);
      } else if (mapa?.contenido) {
        try {
          const contenido = typeof mapa.contenido === 'string' ? JSON.parse(mapa.contenido) : mapa.contenido;
          console.log('Mapa cargado exitosamente');
          console.log(`- Mesas: ${contenido.mesas?.length || 0}`);
          console.log(`- Zonas: ${contenido.zonas?.length || 0}`);
          
          if (contenido.mesas) {
            contenido.mesas.forEach((mesa, i) => {
              console.log(`  Mesa ${i}: ${mesa.shape} - ${mesa.nombre} - Pos: (${mesa.posicion?.x}, ${mesa.posicion?.y})`);
            });
          }
        } catch (e) {
          console.error('Error parsing mapa:', e);
        }
      }
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la prueba
testMapLoading().then(() => {
  console.log('\n=== PRUEBA COMPLETADA ===');
  process.exit(0);
}).catch(error => {
  console.error('Error en la prueba:', error);
  process.exit(1);
}); 