import { createClient } from '@supabase/supabase-js';

// Usar las variables de entorno correctas para Vercel
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Probando conexión a Supabase...');
    
    // Verificar variables de entorno
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl ? supabaseUrl.length : 0,
      keyLength: supabaseKey ? supabaseKey.length : 0
    };

    console.log('📋 Variables de entorno:', envCheck);

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Configuración de Supabase incompleta',
        envCheck
      });
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Probar conexión con una consulta simple
    const { data: testData, error: testError } = await supabase
      .from('zonas')
      .select('COUNT(*)')
      .limit(1);

    if (testError) {
      console.error('❌ Error en conexión a Supabase:', testError);
      return res.status(500).json({ 
        error: testError.message,
        envCheck
      });
    }

    // Probar obtener zonas
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .limit(5);

    if (zonasError) {
      console.error('❌ Error obteniendo zonas:', zonasError);
      return res.status(500).json({ 
        error: zonasError.message,
        envCheck
      });
    }

    // Probar obtener mapas
    const { data: mapas, error: mapasError } = await supabase
      .from('mapas')
      .select('*')
      .limit(5);

    if (mapasError) {
      console.error('❌ Error obteniendo mapas:', mapasError);
      return res.status(500).json({ 
        error: mapasError.message,
        envCheck
      });
    }

    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Datos encontrados:', {
      zonas: zonas?.length || 0,
      mapas: mapas?.length || 0
    });

    return res.status(200).json({
      success: true,
      message: 'Conexión exitosa',
      envCheck,
      data: {
        zonas: zonas?.length || 0,
        mapas: mapas?.length || 0,
        sampleZonas: zonas?.slice(0, 3) || [],
        sampleMapas: mapas?.slice(0, 3) || []
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