export default async function handler(req, res) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing Supabase environment variables'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const results = {
      funciones_encontradas: 0,
      mapas_creados: 0,
      zonas_creadas: 0,
      errores: []
    };
    
    // Obtener las funciones 10 y 11
    const { data: funciones, error: funcError } = await supabase
      .from('funciones')
      .select('*')
      .in('id', [10, 11]);
    
    if (funcError) {
      return res.status(500).json({
        error: 'Error obteniendo funciones',
        details: funcError.message
      });
    }
    
    results.funciones_encontradas = funciones?.length || 0;
    
    for (const funcion of funciones || []) {
      console.log(`Procesando función ${funcion.id}...`);
      
      try {
        // Verificar si existe mapa para la sala
        const { data: mapa, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', funcion.sala)
          .single();
        
        if (!mapa && !mapaError) {
          // Crear mapa para la sala
          const mapaContenido = [
            {
              "_id": "mesa_1",
              "type": "mesa",
              "zona": 1,
              "shape": "circle",
              "width": 120,
              "height": 120,
              "nombre": "Mesa 1",
              "radius": 60,
              "sillas": [
                {
                  "_id": "silla_1",
                  "fila": null,
                  "type": "silla",
                  "zona": 1,
                  "price": null,
                  "width": 20,
                  "height": 20,
                  "nombre": 1,
                  "numero": 1,
                  "status": "available",
                  "mesa_id": "mesa_1",
                  "user_id": null,
                  "parentId": "mesa_1",
                  "posicion": {"x": 50, "y": 50},
                  "bloqueado": false
                },
                {
                  "_id": "silla_2",
                  "fila": null,
                  "type": "silla",
                  "zona": 1,
                  "price": null,
                  "width": 20,
                  "height": 20,
                  "nombre": 2,
                  "numero": 2,
                  "status": "available",
                  "mesa_id": "mesa_1",
                  "user_id": null,
                  "parentId": "mesa_1",
                  "posicion": {"x": 80, "y": 50},
                  "bloqueado": false
                }
              ],
              "posicion": {"x": 100, "y": 100}
            },
            {
              "_id": "mesa_2",
              "type": "mesa",
              "zona": 1,
              "shape": "rect",
              "width": 100,
              "height": 80,
              "nombre": "Mesa 2",
              "sillas": [
                {
                  "_id": "silla_3",
                  "fila": null,
                  "type": "silla",
                  "zona": 1,
                  "price": null,
                  "width": 20,
                  "height": 20,
                  "nombre": 1,
                  "numero": 1,
                  "status": "available",
                  "mesa_id": "mesa_2",
                  "user_id": null,
                  "parentId": "mesa_2",
                  "posicion": {"x": 50, "y": 50},
                  "bloqueado": false
                }
              ],
              "posicion": {"x": 300, "y": 100}
            }
          ];
          
          const { data: nuevoMapa, error: crearMapaError } = await supabase
            .from('mapas')
            .insert({
              sala_id: funcion.sala,
              contenido: mapaContenido
            });
          
          if (!crearMapaError) {
            results.mapas_creados++;
            console.log(`Mapa creado para sala ${funcion.sala}`);
          } else {
            results.errores.push(`Error creando mapa para sala ${funcion.sala}: ${crearMapaError.message}`);
          }
        }
        
        // Verificar si existen zonas para la sala
        const { data: zonas, error: zonasError } = await supabase
          .from('zonas')
          .select('*')
          .eq('sala_id', funcion.sala);
        
        if (!zonasError && (!zonas || zonas.length === 0)) {
          // Crear zona para la sala
          const { data: nuevaZona, error: crearZonaError } = await supabase
            .from('zonas')
            .insert({
              nombre: 'General',
              sala_id: funcion.sala,
              capacidad: 100,
              estado: 'activo'
            });
          
          if (!crearZonaError) {
            results.zonas_creadas++;
            console.log(`Zona creada para sala ${funcion.sala}`);
          } else {
            results.errores.push(`Error creando zona para sala ${funcion.sala}: ${crearZonaError.message}`);
          }
        }
        
      } catch (error) {
        results.errores.push(`Error procesando función ${funcion.id}: ${error.message}`);
      }
    }
    
    // Verificar el resultado final
    const { data: funcionesFinal, error: verificarError } = await supabase
      .from('funciones')
      .select('*')
      .in('id', [10, 11]);
    
    return res.status(200).json({
      success: true,
      message: 'Correcciones aplicadas para funciones existentes',
      results,
      funciones_encontradas: funcionesFinal?.length || 0,
      funciones: funcionesFinal || []
    });
    
  } catch (error) {
    console.error('Error aplicando correcciones:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
} 