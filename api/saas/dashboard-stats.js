// SaaS dashboard statistics
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
    const { tenant_id, period = '30d' } = req.query;

    // Mock data for testing
    const mockStats = {
      total_tenants: 5,
      active_tenants: 4,
      total_events: 25,
      total_sales: 1500,
      total_revenue: 45000.00,
      period: period,
      tenant_id: tenant_id || 'test-tenant',
      metrics: {
        events_created: 12,
        tickets_sold: 850,
        revenue: 25000.00,
        active_users: 8,
        conversion_rate: 3.2
      },
      recent_activity: [
        {
          type: 'event_created',
          message: 'Nuevo evento creado: Concierto de Rock',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          type: 'sale_completed',
          message: 'Venta completada: $150.00',
          timestamp: '2024-01-15T09:15:00Z'
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: mockStats,
      message: 'Dashboard stats loaded successfully'
    });

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
