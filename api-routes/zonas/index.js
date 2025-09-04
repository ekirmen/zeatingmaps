export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { salaId } = req.query;

  if (!salaId) {
    return res.status(400).json({ error: 'ID de sala requerido' });
  }

  try {
    // Por ahora, retornar zonas de prueba
    // En el futuro, esto se conectará a la base de datos
    const zonas = [
      {
        id: 'zona_1',
        nombre: 'Zona Principal',
        color: '#FF6B6B',
        salaId: salaId
      },
      {
        id: 'zona_2',
        nombre: 'Zona VIP',
        color: '#4ECDC4',
        salaId: salaId
      }
    ];

    res.status(200).json(zonas);
  } catch (error) {
    console.error('Error cargando zonas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
