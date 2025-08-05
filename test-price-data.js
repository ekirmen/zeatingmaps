const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (reemplaza con tus credenciales)
const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseKey = 'tu_supabase_anon_key'; // Reemplaza con tu clave real

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPriceData() {
  console.log('=== PRUEBA DE DATOS DE PRECIOS ===\n');

  try {
    // 1. Verificar plantillas
    console.log('1. Verificando plantillas...');
    const { data: plantillas, error: plantillasError } = await supabase
      .from('plantillas')
      .select('*')
      .limit(5);
    
    if (plantillasError) {
      console.error('Error cargando plantillas:', plantillasError);
      return;
    }
    
    console.log(`Plantillas encontradas: ${plantillas?.length || 0}`);
    plantillas?.forEach(p => {
      console.log(`- ID: ${p.id}, Nombre: ${p.nombre}`);
      if (p.detalles) {
        try {
          const detalles = typeof p.detalles === 'string' ? JSON.parse(p.detalles) : p.detalles;
          console.log(`  Detalles: ${detalles.length} elementos`);
          detalles.slice(0, 2).forEach((d, i) => {
            console.log(`    ${i}: zonaId=${d.zonaId} (${typeof d.zonaId}), productoId=${d.productoId} (${typeof d.productoId}), precio=${d.precio}`);
          });
        } catch (e) {
          console.log(`  Error parsing detalles: ${e.message}`);
        }
      }
    });

    // 2. Verificar entradas
    console.log('\n2. Verificando entradas...');
    const { data: entradas, error: entradasError } = await supabase
      .from('entradas')
      .select('*')
      .limit(5);
    
    if (entradasError) {
      console.error('Error cargando entradas:', entradasError);
      return;
    }
    
    console.log(`Entradas encontradas: ${entradas?.length || 0}`);
    entradas?.forEach(e => {
      console.log(`- ID: ${e.id} (${typeof e.id}), Nombre: ${e.nombre_entrada}, Recinto: ${e.recinto}`);
    });

    // 3. Verificar zonas
    console.log('\n3. Verificando zonas...');
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .limit(5);
    
    if (zonasError) {
      console.error('Error cargando zonas:', zonasError);
      return;
    }
    
    console.log(`Zonas encontradas: ${zonas?.length || 0}`);
    zonas?.forEach(z => {
      console.log(`- ID: ${z.id} (${typeof z.id}), Nombre: ${z.nombre}, Sala: ${z.sala_id}`);
    });

    // 4. Verificar funciones
    console.log('\n4. Verificando funciones...');
    const { data: funciones, error: funcionesError } = await supabase
      .from('funciones')
      .select('*, plantilla(*)')
      .limit(5);
    
    if (funcionesError) {
      console.error('Error cargando funciones:', funcionesError);
      return;
    }
    
    console.log(`Funciones encontradas: ${funciones?.length || 0}`);
    funciones?.forEach(f => {
      console.log(`- ID: ${f.id}, Sala: ${f.sala}, Plantilla: ${f.plantilla?.id || 'Sin plantilla'} (${f.plantilla?.nombre || 'N/A'})`);
    });

    // 5. Simulando lógica de DynamicPriceSelector
    console.log('\n5. Simulando lógica de DynamicPriceSelector...');
    if (funciones?.length > 0 && entradas?.length > 0 && zonas?.length > 0) {
      const funcion = funciones[0]; // Usar la primera función
      console.log(`Usando función: ${funcion.id} - Sala: ${funcion.sala}`);
      
      if (!funcion.plantilla) {
        console.log('La función no tiene plantilla asignada');
        return;
      }
      
      const plantilla = funcion.plantilla;
      console.log(`Plantilla asignada: ${plantilla.nombre}`);
      
      let plantillaDetalles = [];
      if (plantilla.detalles) {
        try {
          plantillaDetalles = typeof plantilla.detalles === 'string' 
            ? JSON.parse(plantilla.detalles) 
            : plantilla.detalles;
          console.log('Detalles parseados:', plantillaDetalles);
        } catch (parseError) {
          console.error('Error parsing detalles:', parseError);
        }
      }

      // Filtrar zonas por la sala de la función
      const zonasFuncion = zonas.filter(z => z.sala_id == funcion.sala);
      console.log(`Zonas para sala ${funcion.sala}: ${zonasFuncion.length}`);

      // Crear opciones de precio
      const options = [];
      entradas.forEach(entrada => {
        zonasFuncion.forEach(zona => {
          console.log(`Buscando precio para entrada ${entrada.id} (${entrada.nombre_entrada}) y zona ${zona.id} (${zona.nombre})`);
          
          const precioDetalle = plantillaDetalles.find(detalle => 
            detalle.zonaId == zona.id && detalle.productoId == entrada.id
          );
          
          console.log('Precio detalle encontrado:', precioDetalle);

          if (precioDetalle && precioDetalle.precio) {
            options.push({
              id: `${entrada.id}_${zona.id}`,
              entrada: entrada.nombre_entrada,
              zona: zona.nombre,
              precio: precioDetalle.precio,
              category: 'regular'
            });
          }
        });
      });

      console.log(`Opciones de precio generadas: ${options.length}`);
      options.forEach(opt => {
        console.log(`- ${opt.entrada} - ${opt.zona}: $${opt.precio}`);
      });
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la prueba
testPriceData().then(() => {
  console.log('\n=== PRUEBA COMPLETADA ===');
  process.exit(0);
}).catch(error => {
  console.error('Error en la prueba:', error);
  process.exit(1);
}); 