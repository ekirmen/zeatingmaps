export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { salaId } = req.query;
  const { contenido, zonas } = req.body;

  if (!salaId) {
    return res.status(400).json({ error: 'ID de sala requerido' });
  }

  if (!contenido) {
    return res.status(400).json({ error: 'Contenido del mapa requerido' });
  }

  try {
    // Por ahora, solo loguear los datos recibidos
    // En el futuro, esto se guardará en la base de datos
    console.log(`Guardando mapa para sala ${salaId}:`, {
      contenido: contenido.length,
      zonas: zonas?.length || 0
    });

    // Simular un delay de guardado
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({ 
      success: true, 
      message: 'Mapa guardado correctamente',
      salaId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error guardando mapa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
