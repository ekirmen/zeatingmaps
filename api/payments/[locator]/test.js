export default async function handler(req, res) {
  console.log('🧪 [TEST] Endpoint de prueba llamado');
  
  // Asegurar que se envíe JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Respuesta simple para verificar que el servidor funciona
    return res.status(200).json({
      message: 'Endpoint de prueba funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      query: req.query,
      headers: Object.keys(req.headers)
    });
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint de prueba:', error);
    return res.status(500).json({
      error: 'Error en endpoint de prueba',
      details: error.message
    });
  }
}
