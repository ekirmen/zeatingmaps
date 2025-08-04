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
      eventos_creados: 0,
      recintos_creados: 0,
      salas_creadas: 0,
      plantillas_creadas: 0,
      zonas_creadas: 0,
      mapas_creados: 0,
      funciones_creadas: 0,
      errores: []
    };
    
    try {
      // 1. Crear evento de prueba
      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .upsert({
          id: 1,
          nombre: 'Evento de Prueba',
          slug: 'evento-prueba',
          descripcion: 'Evento de prueba para funciones 10 y 11',
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-12-31',
          estado: 'activo'
        }, { onConflict: 'id' });
      
      if (!eventoError) results.eventos_creados = 1;
      else results.errores.push(`Evento: ${eventoError.message}`);
      
    } catch (error) {
      results.errores.push(`Evento: ${error.message}`);
    }
    
    try {
      // 2. Crear recinto de prueba
      const { data: recinto, error: recintoError } = await supabase
        .from('recintos')
        .upsert({
          id: 1,
          nombre: 'Recinto de Prueba',
          direccion: 'Dirección de Prueba',
          ciudad: 'Caracas',
          estado: 'activo'
        }, { onConflict: 'id' });
      
      if (!recintoError) results.recintos_creados = 1;
      else results.errores.push(`Recinto: ${recintoError.message}`);
      
    } catch (error) {
      results.errores.push(`Recinto: ${error.message}`);
    }
    
    try {
      // 3. Crear sala de prueba
      const { data: sala, error: salaError } = await supabase
        .from('salas')
        .upsert({
          id: 1,
          nombre: 'Sala Principal',
          recinto_id: 1,
          capacidad: 100,
          estado: 'activo'
        }, { onConflict: 'id' });
      
      if (!salaError) results.salas_creadas = 1;
      else results.errores.push(`Sala: ${salaError.message}`);
      
    } catch (error) {
      results.errores.push(`Sala: ${error.message}`);
    }
    
    try {
      // 4. Crear plantilla de precios
      const { data: plantilla, error: plantillaError } = await supabase
        .from('plantillas')
        .upsert({
          id: 1,
          nombre: 'Plantilla Básica',
          descripcion: 'Plantilla de precios básica',
          detalles: [{"zonaId": 1, "precio": 10.00, "nombre": "General"}]
        }, { onConflict: 'id' });
      
      if (!plantillaError) results.plantillas_creadas = 1;
      else results.errores.push(`Plantilla: ${plantillaError.message}`);
      
    } catch (error) {
      results.errores.push(`Plantilla: ${error.message}`);
    }
    
    try {
      // 5. Crear zona de prueba
      const { data: zona, error: zonaError } = await supabase
        .from('zonas')
        .upsert({
          id: 1,
          nombre: 'General',
          sala_id: 1,
          capacidad: 100,
          estado: 'activo'
        }, { onConflict: 'id' });
      
      if (!zonaError) results.zonas_creadas = 1;
      else results.errores.push(`Zona: ${zonaError.message}`);
      
    } catch (error) {
      results.errores.push(`Zona: ${error.message}`);
    }
    
    try {
      // 6. Crear mapa de prueba
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
      
      const { data: mapa, error: mapaError } = await supabase
        .from('mapas')
        .upsert({
          sala_id: 1,
          contenido: mapaContenido
        }, { onConflict: 'sala_id' });
      
      if (!mapaError) results.mapas_creados = 1;
      else results.errores.push(`Mapa: ${mapaError.message}`);
      
    } catch (error) {
      results.errores.push(`Mapa: ${error.message}`);
    }
    
    try {
      // 7. Crear función 10
      const { data: funcion10, error: funcion10Error } = await supabase
        .from('funciones')
        .upsert({
          id: 10,
          fecha_celebracion: '2025-01-15 20:00:00',
          evento: 1,
          sala: 1,
          plantilla: 1
        }, { onConflict: 'id' });
      
      if (!funcion10Error) results.funciones_creadas++;
      else results.errores.push(`Función 10: ${funcion10Error.message}`);
      
    } catch (error) {
      results.errores.push(`Función 10: ${error.message}`);
    }
    
    try {
      // 8. Crear función 11
      const { data: funcion11, error: funcion11Error } = await supabase
        .from('funciones')
        .upsert({
          id: 11,
          fecha_celebracion: '2025-01-16 20:00:00',
          evento: 1,
          sala: 1,
          plantilla: 1
        }, { onConflict: 'id' });
      
      if (!funcion11Error) results.funciones_creadas++;
      else results.errores.push(`Función 11: ${funcion11Error.message}`);
      
    } catch (error) {
      results.errores.push(`Función 11: ${error.message}`);
    }
    
    // Verificar el resultado final
    const { data: funciones, error: verificarError } = await supabase
      .from('funciones')
      .select('*')
      .in('id', [10, 11]);
    
    return res.status(200).json({
      success: true,
      message: 'Correcciones aplicadas',
      results,
      funciones_encontradas: funciones?.length || 0,
      funciones: funciones || []
    });
    
  } catch (error) {
    console.error('Error aplicando correcciones:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
} 