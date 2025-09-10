import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      tenant_id, 
      start_date, 
      end_date,
      event_id,
      group_by = 'day' // day, week, month
    } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id es requerido'
      });
    }

    // Fechas por defecto (últimos 30 días)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('ventas')
      .select(`
        *,
        eventos:evento_id(nombre, slug),
        clientes:cliente_id(nombre, email),
        funciones:funcion_id(nombre, fecha, hora)
      `)
      .eq('tenant_id', tenant_id)
      .eq('estado', 'completada')
      .gte('fecha_venta', startDate.toISOString())
      .lte('fecha_venta', endDate.toISOString())
      .order('fecha_venta', { ascending: true });

    if (event_id) {
      query = query.eq('evento_id', event_id);
    }

    const { data: ventas, error } = await query;

    if (error) throw error;

    // Agrupar datos según el parámetro group_by
    const groupedData = groupSalesData(ventas || [], group_by);

    // Calcular estadísticas
    const stats = calculateSalesStats(ventas || []);

    // Top eventos por ventas
    const topEventos = getTopEventos(ventas || []);

    // Top clientes
    const topClientes = getTopClientes(ventas || []);

    // Ventas por canal (si está disponible)
    const ventasPorCanal = getVentasPorCanal(ventas || []);

    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        },
        grouped_data: groupedData,
        statistics: stats,
        top_eventos: topEventos,
        top_clientes: topClientes,
        ventas_por_canal: ventasPorCanal,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de ventas',
      error: error.message
    });
  }
}

function groupSalesData(ventas, groupBy) {
  const grouped = {};

  ventas.forEach(venta => {
    const fecha = new Date(venta.fecha_venta);
    let key;

    switch (groupBy) {
      case 'day':
        key = fecha.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(fecha);
        weekStart.setDate(fecha.getDate() - fecha.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = fecha.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = {
        fecha: key,
        total_ventas: 0,
        total_ingresos: 0,
        cantidad_entradas: 0,
        ventas: []
      };
    }

    grouped[key].total_ventas += 1;
    grouped[key].total_ingresos += venta.total_precio || 0;
    grouped[key].cantidad_entradas += venta.total_cantidad || 0;
    grouped[key].ventas.push(venta);
  });

  return Object.values(grouped).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

function calculateSalesStats(ventas) {
  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((sum, v) => sum + (v.total_precio || 0), 0);
  const totalEntradas = ventas.reduce((sum, v) => sum + (v.total_cantidad || 0), 0);
  
  const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;
  const entradasPorVenta = totalVentas > 0 ? totalEntradas / totalVentas : 0;

  // Calcular crecimiento vs período anterior
  const mitad = Math.floor(ventas.length / 2);
  const primeraMitad = ventas.slice(0, mitad);
  const segundaMitad = ventas.slice(mitad);

  const ingresosPrimeraMitad = primeraMitad.reduce((sum, v) => sum + (v.total_precio || 0), 0);
  const ingresosSegundaMitad = segundaMitad.reduce((sum, v) => sum + (v.total_precio || 0), 0);

  const crecimientoIngresos = ingresosPrimeraMitad > 0 
    ? ((ingresosSegundaMitad - ingresosPrimeraMitad) / ingresosPrimeraMitad) * 100 
    : 0;

  return {
    total_ventas: totalVentas,
    total_ingresos: totalIngresos,
    total_entradas: totalEntradas,
    ticket_promedio: Math.round(ticketPromedio * 100) / 100,
    entradas_por_venta: Math.round(entradasPorVenta * 100) / 100,
    crecimiento_ingresos: Math.round(crecimientoIngresos * 100) / 100
  };
}

function getTopEventos(ventas) {
  const eventosMap = {};

  ventas.forEach(venta => {
    const evento = venta.eventos;
    if (evento) {
      if (!eventosMap[evento.slug]) {
        eventosMap[evento.slug] = {
          nombre: evento.nombre,
          slug: evento.slug,
          ventas: 0,
          ingresos: 0,
          entradas: 0
        };
      }
      eventosMap[evento.slug].ventas += 1;
      eventosMap[evento.slug].ingresos += venta.total_precio || 0;
      eventosMap[evento.slug].entradas += venta.total_cantidad || 0;
    }
  });

  return Object.values(eventosMap)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);
}

function getTopClientes(ventas) {
  const clientesMap = {};

  ventas.forEach(venta => {
    const cliente = venta.clientes;
    if (cliente) {
      if (!clientesMap[cliente.email]) {
        clientesMap[cliente.email] = {
          nombre: cliente.nombre,
          email: cliente.email,
          ventas: 0,
          ingresos: 0,
          entradas: 0
        };
      }
      clientesMap[cliente.email].ventas += 1;
      clientesMap[cliente.email].ingresos += venta.total_precio || 0;
      clientesMap[cliente.email].entradas += venta.total_cantidad || 0;
    }
  });

  return Object.values(clientesMap)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);
}

function getVentasPorCanal(ventas) {
  const canales = {};

  ventas.forEach(venta => {
    const canal = venta.canal || 'web';
    if (!canales[canal]) {
      canales[canal] = {
        canal,
        ventas: 0,
        ingresos: 0
      };
    }
    canales[canal].ventas += 1;
    canales[canal].ingresos += venta.total_precio || 0;
  });

  return Object.values(canales)
    .sort((a, b) => b.ingresos - a.ingresos);
}
