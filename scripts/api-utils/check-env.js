export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Verificando variables de entorno...');
    
    // Verificar todas las variables de entorno posibles
    const envVars = {
      // Variables de Supabase
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      REACT_APP_SUPABASE_SERVICE_ROLE_KEY: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Variables de entorno generales
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      
      // Variables de build
      CI: process.env.CI,
      GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP,
      DISABLE_ESLINT_PLUGIN: process.env.DISABLE_ESLINT_PLUGIN,
      SKIP_PREFLIGHT_CHECK: process.env.SKIP_PREFLIGHT_CHECK
    };

    // Verificar si las variables de Supabase están disponibles
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      urlLength: supabaseUrl ? supabaseUrl.length : 0,
      keyLength: supabaseKey ? supabaseKey.length : 0,
      urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'No disponible',
      keyStartsWith: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'No disponible'
    };

    console.log('📋 Variables de entorno encontradas:', envCheck);

    // Verificar si las variables críticas están disponibles
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
      return res.status(500).json({
        error: 'Variables de entorno faltantes',
        missing: missingVars,
        envCheck,
        allEnvVars: envVars
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Variables de entorno verificadas correctamente',
      envCheck,
      allEnvVars: envVars
    });

  } catch (error) {
    console.error('❌ Error verificando variables de entorno:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
} 