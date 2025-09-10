// Load zonas for grid sale mode
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { evento } = req.body;

    if (!evento || !evento.recinto || !evento.sala) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: evento.recinto and evento.sala'
      });
    }

    // Mock data for testing
    const mockZonas = [
      {
        id: 22,
        nombre: 'Zona A',
        aforo: 100,
        color: '#ff6b6b',
        numerada: false,
        sala_id: evento.sala.toString()
      },
      {
        id: 23,
        nombre: 'Zona B',
        aforo: 50,
        color: '#4ecdc4',
        numerada: true,
        sala_id: evento.sala.toString()
      }
    ];

    const mockPrecios = {
      22: 10.00,
      23: 15.00
    };

    res.status(200).json({
      success: true,
      data: {
        zonas: mockZonas,
        precios: mockPrecios
      },
      message: 'Zonas loaded successfully'
    });

  } catch (error) {
    console.error('Error loading zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
