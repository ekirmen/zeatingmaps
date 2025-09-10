import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { tenant_id, period = '30d' } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id es requerido'
      });
    }

    // Calcular fechas según el período
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Estadísticas de eventos
    const { data: eventosStats, error: eventosError } = await supabase
      .from('eventos')
      .select('id, created_at, status')
      .eq('tenant_id', tenant_id)
      .gte('created_at', startDate.toISOString());

    if (eventosError) throw eventosError;

    // Estadísticas de ventas
    const { data: ventasStats, error: ventasError } = await supabase
      .from('ventas')
      .select('id, total_precio, fecha_venta, estado')
      .eq('tenant_id', tenant_id)
      .gte('fecha_venta', startDate.toISOString());

    if (ventasError) throw ventasError;

    // Estadísticas de clientes
    const { data: clientesStats, error: clientesError } = await supabase
      .from('clientes')
      .select('id, created_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', startDate.toISOString());

    if (clientesError) throw clientesError;

    // Calcular métricas
    const totalEventos = eventosStats?.length || 0;
    const eventosActivos = eventosStats?.filter(e => e.status === 'active').length || 0;
    const eventosInactivos = eventosStats?.filter(e => e.status === 'inactive').length || 0;

    const totalVentas = ventasStats?.length || 0;
    const ventasCompletadas = ventasStats?.filter(v => v.estado === 'completada').length || 0;
    const ventasCanceladas = ventasStats?.filter(v => v.estado === 'cancelada').length || 0;
    const ingresosTotales = ventasStats?.reduce((sum, v) => sum + (v.total_precio || 0), 0) || 0;

    const totalClientes = clientesStats?.length || 0;

    // Calcular crecimiento
    const previousPeriod = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    
    const { data: previousVentas, error: prevVentasError } = await supabase
      .from('ventas')
      .select('total_precio')
      .eq('tenant_id', tenant_id)
      .gte('fecha_venta', previousPeriod.toISOString())
      .lt('fecha_venta', startDate.toISOString());

    const previousIngresos = previousVentas?.reduce((sum, v) => sum + (v.total_precio || 0), 0) || 0;
    const crecimientoIngresos = previousIngresos > 0 
      ? ((ingresosTotales - previousIngresos) / previousIngresos) * 100 
      : 0;

    // Eventos más populares (por ventas)
    const { data: eventosPopulares, error: eventosPopError } = await supabase
      .from('ventas')
      .select(`
        eventos:evento_id(nombre, slug),
        total_precio
      `)
      .eq('tenant_id', tenant_id)
      .gte('fecha_venta', startDate.toISOString())
      .eq('estado', 'completada');

    const eventosConVentas = {};
    eventosPopulares?.forEach(venta => {
      const evento = venta.eventos;
      if (evento) {
        if (!eventosConVentas[evento.slug]) {
          eventosConVentas[evento.slug] = {
            nombre: evento.nombre,
            slug: evento.slug,
            ventas: 0,
            ingresos: 0
          };
        }
        eventosConVentas[evento.slug].ventas += 1;
        eventosConVentas[evento.slug].ingresos += venta.total_precio || 0;
      }
    });

    const topEventos = Object.values(eventosConVentas)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        period,
        summary: {
          eventos: {
            total: totalEventos,
            activos: eventosActivos,
            inactivos: eventosInactivos
          },
          ventas: {
            total: totalVentas,
            completadas: ventasCompletadas,
            canceladas: ventasCanceladas,
            ingresos_totales: ingresosTotales,
            crecimiento_ingresos: Math.round(crecimientoIngresos * 100) / 100
          },
          clientes: {
            total: totalClientes
          }
        },
        top_eventos: topEventos,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
}
