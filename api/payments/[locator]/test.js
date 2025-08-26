export default async function handler(req, res) {
  console.log('🧪 [TEST] Endpoint de prueba llamado');
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Información básica del servidor
    const serverInfo = {
      status: 'running',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL
      }
    };
    
    // Verificar que el servidor pueda responder
    const healthCheck = {
      server: 'OK',
      timestamp: serverInfo.timestamp,
      message: 'El servidor está funcionando correctamente'
    };
    
    console.log('🧪 [TEST] Prueba completada exitosamente');
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      healthCheck,
      serverInfo,
      message: 'Endpoint de prueba funcionando correctamente'
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint de prueba:', error);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Error en endpoint de prueba',
      details: error.message
    });
  }
}
