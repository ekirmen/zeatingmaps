export default async function handler(req, res) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing Supabase environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar funciones 10 y 11
    const { data: funciones, error: funcError } = await supabase
      .from('funciones')
      .select(`
        id,
        fecha_celebracion,
        evento,
        sala,
        plantilla
      `)
      .in('id', [10, 11]);
    
    if (funcError) {
      return res.status(500).json({
        error: 'Error fetching funciones',
        details: funcError.message
      });
    }
    
    const results = [];
    
    for (const funcion of funciones || []) {
      console.log(`Diagnosticando función ${funcion.id}...`);
      
      // Obtener datos del evento
      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', funcion.evento)
        .single();
      
      // Obtener datos de la sala
      const { data: sala, error: salaError } = await supabase
        .from('salas')
        .select('*')
        .eq('id', funcion.sala)
        .single();
      
      // Obtener mapa de la sala
      const { data: mapa, error: mapaError } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', funcion.sala)
        .single();
      
      // Obtener zonas de la sala
      const { data: zonas, error: zonasError } = await supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', funcion.sala);
      
      // Obtener plantilla de precios
      const { data: plantilla, error: plantillaError } = await supabase
        .from('plantillas')
        .select('*')
        .eq('id', funcion.plantilla)
        .single();
      
      const funcionData = {
        id: funcion.id,
        fecha_celebracion: funcion.fecha_celebracion,
        evento: {
          exists: !!evento,
          error: eventoError?.message,
          data: evento ? {
            id: evento.id,
            nombre: evento.nombre,
            slug: evento.slug
          } : null
        },
        sala: {
          exists: !!sala,
          error: salaError?.message,
          data: sala ? {
            id: sala.id,
            nombre: sala.nombre
          } : null
        },
        mapa: {
          exists: !!mapa,
          error: mapaError?.message,
          data: mapa ? {
            id: mapa.id,
            sala_id: mapa.sala_id,
            has_contenido: !!mapa.contenido,
            contenido_type: typeof mapa.contenido,
            contenido_length: mapa.contenido ? JSON.stringify(mapa.contenido).length : 0
          } : null
        },
        zonas: {
          exists: !!zonas,
          error: zonasError?.message,
          count: zonas?.length || 0,
          data: zonas?.map(z => ({
            id: z.id,
            nombre: z.nombre,
            sala_id: z.sala_id
          })) || []
        },
        plantilla: {
          exists: !!plantilla,
          error: plantillaError?.message,
          data: plantilla ? {
            id: plantilla.id,
            nombre: plantilla.nombre,
            has_detalles: !!plantilla.detalles
          } : null
        }
      };
      
      results.push(funcionData);
    }
    
    // Verificar si hay mapas sin contenido válido
    const { data: mapasVacios, error: mapasError } = await supabase
      .from('mapas')
      .select('id, sala_id, contenido')
      .or('contenido.is.null,contenido.eq.{}');
    
    return res.status(200).json({
      success: true,
      funciones_encontradas: funciones?.length || 0,
      funciones: results,
      mapas_vacios: {
        count: mapasVacios?.length || 0,
        data: mapasVacios?.map(m => ({
          id: m.id,
          sala_id: m.sala_id,
          contenido: m.contenido
        })) || []
      },
      environment: {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }
    });
    
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      stack: error.stack
    });
  }
} 