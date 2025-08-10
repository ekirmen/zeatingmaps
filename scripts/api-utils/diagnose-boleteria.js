import { createClient } from '@supabase/supabase-js';

// Usar las variables de entorno correctas para Vercel
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Iniciando diagnóstico de boletería...');
    
    // Verificar variables de entorno
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl ? supabaseUrl.length : 0,
      keyLength: supabaseKey ? supabaseKey.length : 0
    };

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Configuración de Supabase incompleta',
        envCheck
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verificar eventos
    console.log('📋 Verificando eventos...');
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('*')
      .eq('activo', true)
      .limit(5);

    if (eventosError) {
      console.error('❌ Error obteniendo eventos:', eventosError);
      return res.status(500).json({ error: eventosError.message });
    }

    // 2. Verificar funciones
    console.log('📋 Verificando funciones...');
    const { data: funciones, error: funcionesError } = await supabase
      .from('funciones')
      .select('*, sala(*)')
      .limit(5);

    if (funcionesError) {
      console.error('❌ Error obteniendo funciones:', funcionesError);
      return res.status(500).json({ error: funcionesError.message });
    }

    // 3. Verificar salas
    console.log('📋 Verificando salas...');
    const { data: salas, error: salasError } = await supabase
      .from('salas')
      .select('*')
      .limit(5);

    if (salasError) {
      console.error('❌ Error obteniendo salas:', salasError);
      return res.status(500).json({ error: salasError.message });
    }

    // 4. Verificar zonas
    console.log('📋 Verificando zonas...');
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .limit(10);

    if (zonasError) {
      console.error('❌ Error obteniendo zonas:', zonasError);
      return res.status(500).json({ error: zonasError.message });
    }

    // 5. Verificar mapas
    console.log('📋 Verificando mapas...');
    const { data: mapas, error: mapasError } = await supabase
      .from('mapas')
      .select('*')
      .limit(5);

    if (mapasError) {
      console.error('❌ Error obteniendo mapas:', mapasError);
      return res.status(500).json({ error: mapasError.message });
    }

    // 6. Verificar asientos
    console.log('📋 Verificando asientos...');
    const { data: asientos, error: asientosError } = await supabase
      .from('seats')
      .select('*')
      .limit(10);

    if (asientosError) {
      console.error('❌ Error obteniendo asientos:', asientosError);
      return res.status(500).json({ error: asientosError.message });
    }

    // 7. Verificar plantillas
    console.log('📋 Verificando plantillas...');
    const { data: plantillas, error: plantillasError } = await supabase
      .from('plantillas')
      .select('*')
      .limit(5);

    if (plantillasError) {
      console.error('❌ Error obteniendo plantillas:', plantillasError);
      return res.status(500).json({ error: plantillasError.message });
    }

    // 8. Verificar específicamente la sala 7
    console.log('📋 Verificando sala 7...');
    const { data: sala7, error: sala7Error } = await supabase
      .from('salas')
      .select('*')
      .eq('id', 7)
      .single();

    if (sala7Error) {
      console.error('❌ Error obteniendo sala 7:', sala7Error);
    }

    // 9. Verificar zonas de la sala 7
    console.log('📋 Verificando zonas de sala 7...');
    const { data: zonasSala7, error: zonasSala7Error } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', 7);

    if (zonasSala7Error) {
      console.error('❌ Error obteniendo zonas de sala 7:', zonasSala7Error);
    }

    // 10. Verificar mapa de la sala 7
    console.log('📋 Verificando mapa de sala 7...');
    const { data: mapaSala7, error: mapaSala7Error } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', 7)
      .single();

    if (mapaSala7Error) {
      console.error('❌ Error obteniendo mapa de sala 7:', mapaSala7Error);
    }

    console.log('✅ Diagnóstico completado');

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico completado',
      envCheck,
      data: {
        eventos: {
          count: eventos?.length || 0,
          sample: eventos?.slice(0, 3) || []
        },
        funciones: {
          count: funciones?.length || 0,
          sample: funciones?.slice(0, 3) || []
        },
        salas: {
          count: salas?.length || 0,
          sample: salas?.slice(0, 3) || []
        },
        zonas: {
          count: zonas?.length || 0,
          sample: zonas?.slice(0, 3) || []
        },
        mapas: {
          count: mapas?.length || 0,
          sample: mapas?.slice(0, 3) || []
        },
        asientos: {
          count: asientos?.length || 0,
          sample: asientos?.slice(0, 3) || []
        },
        plantillas: {
          count: plantillas?.length || 0,
          sample: plantillas?.slice(0, 3) || []
        },
        sala7: {
          exists: !!sala7,
          data: sala7
        },
        zonasSala7: {
          count: zonasSala7?.length || 0,
          data: zonasSala7 || []
        },
        mapaSala7: {
          exists: !!mapaSala7,
          data: mapaSala7
        }
      }
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
} 