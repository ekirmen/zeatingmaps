export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { salaId } = req.query;

  if (!salaId) {
    return res.status(400).json({ error: 'ID de sala requerido' });
  }

  try {
    // Por ahora, retornar datos de prueba
    // En el futuro, esto se conectará a la base de datos
    const mapaData = {
      success: true,
      data: {
        contenido: [
          {
            _id: 'mesa_prueba_1',
            type: 'mesa',
            shape: 'rect',
            posicion: { x: 100, y: 100 },
            width: 120,
            height: 80,
            nombre: 'Mesa de Prueba 1',
            zonaId: null,
            sillas: []
          },
          {
            _id: 'mesa_prueba_2',
            type: 'mesa',
            shape: 'circle',
            posicion: { x: 300, y: 100 },
            radius: 60,
            nombre: 'Mesa de Prueba 2',
            zonaId: null,
            sillas: []
          }
        ],
        zonas: []
      }
    };

    res.status(200).json(mapaData);
  } catch (error) {
    console.error('Error cargando mapa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
