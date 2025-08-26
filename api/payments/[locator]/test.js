export default async function handler(req, res) {
  console.log('🧪 [TEST] Endpoint de prueba llamado');
  console.log('🔍 [TEST] Método:', req.method);
  console.log('🔍 [TEST] URL:', req.url);
  console.log('🔍 [TEST] Headers:', req.headers);
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar variables de entorno críticas
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
      VERCEL_URL: process.env.VERCEL_URL || 'undefined',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Presente' : '❌ Faltante',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Faltante'
    };
    
    // Información básica del servidor
    const serverInfo = {
      status: 'running',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: envCheck
    };
    
    // Verificar que el servidor pueda responder
    const healthCheck = {
      server: 'OK',
      timestamp: serverInfo.timestamp,
      message: 'El servidor está funcionando correctamente',
      environment: envCheck.NODE_ENV,
      vercelEnvironment: envCheck.VERCEL_ENV
    };
    
    console.log('🧪 [TEST] Prueba completada exitosamente');
    console.log('🧪 [TEST] Variables de entorno:', envCheck);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.status(200).json({
      success: true,
      healthCheck,
      serverInfo,
      message: 'Endpoint de prueba funcionando correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint de prueba:', error);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Error en endpoint de prueba',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
