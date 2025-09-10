// List events endpoint
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { tenant_id, limit = 10, offset = 0 } = req.query;

    // Mock data for testing
    const mockEvents = [
      {
        id: '1',
        nombre: 'Concierto de Rock',
        slug: 'concierto-rock-2024',
        descripcion: 'Un concierto épico de rock',
        fecha_inicio: '2024-12-25T20:00:00Z',
        fecha_fin: '2024-12-25T23:00:00Z',
        estado: 'activo',
        modoVenta: 'grid',
        recinto: 67,
        sala: 52,
        tenant_id: tenant_id || 'test-tenant'
      },
      {
        id: '2',
        nombre: 'Teatro Clásico',
        slug: 'teatro-clasico-2024',
        descripcion: 'Obra de teatro clásica',
        fecha_inicio: '2024-12-26T19:00:00Z',
        fecha_fin: '2024-12-26T21:30:00Z',
        estado: 'activo',
        modoVenta: 'mapa',
        recinto: 67,
        sala: 52,
        tenant_id: tenant_id || 'test-tenant'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        events: mockEvents.slice(offset, offset + parseInt(limit)),
        total: mockEvents.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      message: 'Events loaded successfully'
    });

  } catch (error) {
    console.error('Error loading events:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
