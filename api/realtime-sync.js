// API endpoint para sincronización en tiempo real
// Este endpoint maneja las peticiones del RealtimeService del frontend

export default async function handler(req, res) {
  // Configurar CORS para desarrollo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: 'Método no permitido',
      allowedMethods: ['POST']
    });
    return;
  }

  try {
    const { salaId, action, data } = req.body;

    if (!salaId || !action) {
      res.status(400).json({ 
        success: false, 
        error: 'salaId y action son requeridos',
        received: { salaId, action }
      });
      return;
    }

    console.log(`[API] Realtime sync - Sala: ${salaId}, Acción: ${action}`);

    switch (action) {
      case 'get_updates':
        // Simular obtención de actualizaciones
        // En una implementación real, aquí consultarías la base de datos
        const mockUpdate = {
          id: `mapa-${salaId}`,
          sala_id: salaId,
          updated_at: new Date().toISOString(),
          content: 'mock-content',
          timestamp: Date.now()
        };

        res.status(200).json({
          success: true,
          data: mockUpdate,
          timestamp: new Date().toISOString(),
          message: 'Actualización obtenida exitosamente'
        });
        break;

      case 'notify_change':
        // Simular notificación de cambio
        // En una implementación real, aquí notificarías a otros clientes
        console.log(`[API] Cambio notificado para sala ${salaId}:`, data);

        res.status(200).json({
          success: true,
          message: 'Cambio notificado exitosamente',
          timestamp: new Date().toISOString(),
          salaId,
          data: data || null
        });
        break;

      case 'health_check':
        // Endpoint de verificación de salud
        res.status(200).json({
          success: true,
          message: 'API funcionando correctamente',
          timestamp: new Date().toISOString(),
          status: 'healthy',
          version: '1.0.0'
        });
        break;

      default:
        res.status(400).json({
          success: false,
          error: 'Acción no válida',
          allowedActions: ['get_updates', 'notify_change', 'health_check'],
          receivedAction: action
        });
    }

  } catch (error) {
    console.error('[API] Error en realtime-sync:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
