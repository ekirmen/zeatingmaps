const express = require('express');
const cors = require('cors');

module.exports = function (app) {
  // Crear una instancia de Express para manejar las rutas de API
  const apiRouter = express.Router();

  // Middleware para parsear JSON
  apiRouter.use(express.json());

  // Middleware CORS
  apiRouter.use(cors());

  // Endpoint para realtime-sync
  apiRouter.post('/realtime-sync', (req, res) => {
    try {
      const { salaId, action } = req.body;
      // Simular respuesta exitosa
      return res.status(200).json({
        success: true,
        data: {
          updates: [],
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[API LOCAL] Error en realtime-sync:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  });

  // Endpoint para guardar mapas
  apiRouter.post('/mapas/:salaId/save', (req, res) => {
    try {
      const { salaId } = req.params;
      const { contenido, zonas } = req.body;
      const savedMapa = {
        id: `mapa-${salaId}`,
        sala_id: parseInt(salaId),
        contenido: contenido || [],
        zonas: zonas || [],
        updated_at: new Date().toISOString(),
        timestamp: Date.now()
      };
      return res.status(200).json({
        success: true,
        message: 'Mapa guardado exitosamente',
        data: savedMapa,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[API LOCAL] Error al guardar mapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  });

  // Endpoint para obtener mapas
  apiRouter.get('/mapas/:salaId', (req, res) => {
    try {
      const { salaId } = req.params;
      const mockMapa = {
        id: `mapa-${salaId}`,
        sala_id: parseInt(salaId),
        contenido: [
          {
            type: 'mesa',
            _id: 'mesa-1',
            x: 100,
            y: 100,
            sillas: [
              { _id: 'silla-1', x: 0, y: 0 },
              { _id: 'silla-2', x: 50, y: 0 }
            ]
          }
        ],
        zonas: [
          {
            id: 'zona-1',
            nombre: 'Zona Principal',
            elementos: ['mesa-1']
          }
        ],
        updated_at: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        data: mockMapa,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[API LOCAL] Error al obtener mapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  });



  // Endpoint para logs de auditoría (local mock)
  apiRouter.post('/audit/create', (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API LOCAL] Audit Log Received:', req.body.logs ? `Batch of ${req.body.logs.length}` : 'Single log');
      }
      return res.status(200).json({
        success: true,
        data: [{ id: `local-log-${Date.now()}`, created_at: new Date().toISOString() }]
      });
    } catch (error) {
      console.error('[API LOCAL] Error in audit-create:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Usar el router de API en la ruta /api
  app.use('/api', apiRouter);
};
