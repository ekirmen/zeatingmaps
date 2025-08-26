export default async function handler(req, res) {
  console.log('🧪 [SIMPLE-TEST] Endpoint de prueba simple llamado');
  
  // Asegurar que se envíe JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Respuesta simple para verificar que el servidor funciona
    return res.status(200).json({
      message: 'Endpoint de prueba simple funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      query: req.query,
      headers: Object.keys(req.headers),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL
      }
    });
  } catch (error) {
    console.error('❌ [SIMPLE-TEST] Error en endpoint de prueba simple:', error);
    return res.status(500).json({
      error: 'Error en endpoint de prueba simple',
      details: error.message
    });
  }
}
